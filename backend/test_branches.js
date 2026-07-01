require('dotenv').config();
const axios = require('axios');
const generateToken = require('./utils/generateToken');
const prisma = require('./config/prisma');

const API_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
    console.log('=== STARTING MULTI-BRANCH SECURITY & CRUD TESTS ===');
    
    // Find a superadmin to act as the operator
    const superAdmin = await prisma.user.findFirst({ where: { role: 'superadmin' } });
    if (!superAdmin) {
        console.error('❌ Error: No superadmin found in the database. Run createSuperAdmin.js first.');
        process.exit(1);
    }
    console.log(`✅ Found Super Admin: ${superAdmin.email}`);
    const token = generateToken(superAdmin.id, 'superadmin');

    // Use H4 Fitness gym ID
    const gymId = '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
    
    let testBranchId = null;

    try {
        // 1. Create a new branch via API
        console.log('\nTesting: Create Branch...');
        const createRes = await axios.post(`${API_URL}/branches`, {
            name: 'Test Temp Branch',
            address: '456 Test St',
            phone: '555-0199',
            email: 'temp@h4gym.com',
            managerName: 'Temp Manager',
            fitPassEnabled: false
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': gymId
            }
        });
        
        const branch = createRes.data;
        testBranchId = branch.id || branch._id;
        console.log(`✅ Branch Created successfully. ID: ${testBranchId}, Name: ${branch.name}`);

        // 2. Fetch all branches for gymId and verify our new branch is in the list
        console.log('\nTesting: List Branches...');
        const listRes = await axios.get(`${API_URL}/branches`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': gymId
            }
        });
        
        const branches = listRes.data;
        const found = branches.find(b => (b.id || b._id) === testBranchId);
        if (found) {
            console.log(`✅ Successfully listed branches. Found temp branch: ${found.name}`);
        } else {
            throw new Error('❌ Failed: Temp branch was not returned in the list.');
        }

        // 3. Test Scoped Requests (passing x-branch-id)
        console.log('\nTesting: Scoped branch filtering...');
        const listScopedRes = await axios.get(`${API_URL}/branches`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': gymId,
                'x-branch-id': testBranchId
            }
        });
        
        const scopedBranches = listScopedRes.data;
        console.log(`ℹ️ Scoped branches count returned: ${scopedBranches.length}`);
        if (scopedBranches.length === 1 && (scopedBranches[0].id || scopedBranches[0]._id) === testBranchId) {
            console.log('✅ Scoped filtering successfully isolated requests to ONLY the specified branch ID.');
        } else {
            throw new Error('❌ Failed: Scoped branches list should contain exactly one branch.');
        }

        // 4. Update the branch
        console.log('\nTesting: Update Branch...');
        const updateRes = await axios.put(`${API_URL}/branches/${testBranchId}`, {
            name: 'Test Temp Branch Updated',
            address: '789 Updated St'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': gymId
            }
        });
        console.log(`✅ Branch Updated: ${updateRes.data.name} - ${updateRes.data.address}`);

        // 5. Delete the branch
        console.log('\nTesting: Delete Branch...');
        const deleteRes = await axios.delete(`${API_URL}/branches/${testBranchId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': gymId
            }
        });
        console.log(`✅ Delete response: ${deleteRes.data.message}`);

        // Double check it's gone
        const verifyListRes = await axios.get(`${API_URL}/branches`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': gymId
            }
        });
        const remaining = verifyListRes.data;
        const stillExists = remaining.some(b => (b.id || b._id) === testBranchId);
        if (!stillExists) {
            console.log('✅ Verified: Temp branch was successfully deleted and no longer appears in the list.');
        } else {
            throw new Error('❌ Failed: Temp branch still exists after deletion request.');
        }

        console.log('\n🏆 ALL TESTS PASSED SUCCESSFULLY! MULTI-BRANCH LOGIC IS PERFECT.');

    } catch (err) {
        console.error('\n❌ Test execution failed!');
        console.error(err.response ? err.response.data : err.message);
        
        // Cleanup if necessary
        if (testBranchId) {
            console.log(`\nCleaning up temporary branch: ${testBranchId}...`);
            try {
                await prisma.branch.deleteMany({ where: { id: testBranchId } });
                console.log('🧹 Cleanup completed.');
            } catch (cleanupErr) {
                console.error('Error during cleanup:', cleanupErr.message);
            }
        }
    } finally {
        prisma.$disconnect();
    }
}

runTests();
