const TrainerSalary = require('../models/TrainerSalary');
const PtCommission = require('../models/PtCommission');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const PtSession = require('../models/PtSession');

// @desc    Upsert Trainer Salary Configuration
// @route   POST /api/payroll/salary-structure
// @access  Private (Admin)
const upsertSalaryStructure = async (req, res) => {
    try {
        const { trainerId, fixedSalary, commissionPt } = req.body;

        if (!trainerId) {
            return res.status(400).json({ success: false, message: 'Trainer ID is required' });
        }

        // Validate trainer exists
        const trainer = await User.findOne({ _id: trainerId, gymId: req.user.gymId });
        if (!trainer || trainer.role !== 'trainer') {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        let salary = await TrainerSalary.findOne({ trainerId, gymId: req.user.gymId });

        if (salary) {
            salary.fixedSalary = Number(fixedSalary);
            salary.commissionPt = Number(commissionPt);
            const updated = await salary.save();
            return res.json(updated);
        } else {
            const created = await TrainerSalary.create({
                trainerId,
                fixedSalary: Number(fixedSalary),
                commissionPt: Number(commissionPt),
                gymId: req.user.gymId
            });
            return res.status(201).json(created);
        }
    } catch (error) {
        console.error("UPSERT SALARY STRUCTURE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Salary Configuration for a Trainer
// @route   GET /api/payroll/salary-structure/:trainerId
// @access  Private (Admin/Trainer)
const getSalaryStructure = async (req, res) => {
    try {
        const { trainerId } = req.params;

        if (req.user.role === 'trainer' && req.user.id !== trainerId) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this structure' });
        }

        const salary = await TrainerSalary.findOne({ trainerId, gymId: req.user.gymId });

        if (!salary) {
            return res.json({
                trainerId,
                fixedSalary: 0,
                commissionPt: 0,
                gymId: req.user.gymId
            });
        }

        res.json(salary);
    } catch (error) {
        console.error("GET SALARY STRUCTURE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate/Recalculate Monthly Payroll
// @route   POST /api/payroll/generate
// @access  Private (Admin)
const generateMonthlyPayroll = async (req, res) => {
    try {
        const { trainerId, month, year, incentives } = req.body;

        if (!trainerId || !month || !year) {
            return res.status(400).json({ success: false, message: 'Trainer ID, Month (1-12), and Year are required' });
        }

        // Get trainer salary config
        const salaryConfig = await TrainerSalary.findOne({ trainerId, gymId: req.user.gymId });
        const fixedSalary = salaryConfig ? salaryConfig.fixedSalary : 0;
        const commissionRate = salaryConfig ? salaryConfig.commissionPt : 0;

        // Calculate commissions: Sum amount from PtCommission logged in this month & year
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Fetch commissions matching dates
        const commissionsList = await PtCommission.find({
            trainerId,
            gymId: req.user.gymId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });
        const calculatedCommissions = commissionsList.reduce((sum, item) => sum + item.amount, 0);

        // Also calculate auto-commissions from completed PtSessions in this period if no manual commissions exist
        // Note: Let's sum up completed PT sessions during this month to auto-calculate if there are no logged commissions
        let finalCommissions = calculatedCommissions;
        if (commissionsList.length === 0 && commissionRate > 0) {
            const completedSessions = await PtSession.find({
                trainerId,
                gymId: req.user.gymId,
                status: 'Completed',
                sessionDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            });
            finalCommissions = completedSessions.length * commissionRate;

            // Log these auto-calculated commissions so they persist
            for (const s of completedSessions) {
                await PtCommission.create({
                    trainerId,
                    sessionId: s._id,
                    amount: commissionRate,
                    date: s.sessionDate,
                    gymId: req.user.gymId
                });
            }
        }

        const finalIncentives = incentives !== undefined ? Number(incentives) : 0;
        const totalAmount = fixedSalary + finalCommissions + finalIncentives;

        // Check if payroll record already exists for this month
        let payroll = await Payroll.findOne({
            trainerId,
            month: Number(month),
            year: Number(year),
            gymId: req.user.gymId
        });

        if (payroll) {
            // Update existing
            payroll.fixedSalary = fixedSalary;
            payroll.commissions = finalCommissions;
            payroll.incentives = finalIncentives;
            payroll.totalAmount = totalAmount;
            const updated = await payroll.save();
            return res.json(updated);
        } else {
            // Create new
            const created = await Payroll.create({
                trainerId,
                month: Number(month),
                year: Number(year),
                fixedSalary,
                commissions: finalCommissions,
                incentives: finalIncentives,
                totalAmount,
                status: 'Pending',
                gymId: req.user.gymId
            });
            return res.status(201).json(created);
        }
    } catch (error) {
        console.error("GENERATE PAYROLL ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Payroll Records
// @route   GET /api/payroll
// @access  Private (Admin/Trainer)
const getPayrolls = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId };

        if (req.user.role === 'trainer') {
            query.trainerId = req.user.id;
        } else if (req.query.trainerId) {
            query.trainerId = req.query.trainerId;
        }

        if (req.query.month) query.month = Number(req.query.month);
        if (req.query.year) query.year = Number(req.query.year);

        const payrolls = await Payroll.find(query).sort({ year: -1, month: -1 }).lean();

        // Populate Trainer details
        const formatted = [];
        for (const p of payrolls) {
            const trainerObj = await User.findOne({ _id: p.trainerId }).select('-password');
            formatted.push({
                ...p,
                trainer: trainerObj ? { id: trainerObj.id, name: trainerObj.name, email: trainerObj.email } : null
            });
        }

        res.json(formatted);
    } catch (error) {
        console.error("GET PAYROLLS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Payroll Status / Process Payment
// @route   PUT /api/payroll/:id
// @access  Private (Admin)
const updatePayrollStatus = async (req, res) => {
    try {
        const { status, incentives } = req.body;
        const payroll = await Payroll.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll record not found' });
        }

        if (incentives !== undefined) {
            payroll.incentives = Number(incentives);
            payroll.totalAmount = payroll.fixedSalary + payroll.commissions + payroll.incentives;
        }

        if (status) {
            payroll.status = status;
            if (status === 'Paid') {
                payroll.paymentDate = new Date();
            } else {
                payroll.paymentDate = null;
            }
        }

        const updated = await payroll.save();
        res.json(updated);
    } catch (error) {
        console.error("UPDATE PAYROLL STATUS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Record manual commission entry
// @route   POST /api/payroll/commission
// @access  Private (Admin)
const addCommission = async (req, res) => {
    try {
        const { trainerId, amount, date, sessionId } = req.body;

        if (!trainerId || amount === undefined) {
            return res.status(400).json({ success: false, message: 'Trainer ID and Amount are required' });
        }

        // Validate trainer
        const trainer = await User.findOne({ _id: trainerId, gymId: req.user.gymId });
        if (!trainer || trainer.role !== 'trainer') {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        const commission = await PtCommission.create({
            trainerId,
            sessionId: sessionId || null,
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
            gymId: req.user.gymId
        });

        res.status(201).json(commission);
    } catch (error) {
        console.error("ADD COMMISSION ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    upsertSalaryStructure,
    getSalaryStructure,
    generateMonthlyPayroll,
    getPayrolls,
    updatePayrollStatus,
    addCommission
};
