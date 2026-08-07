const catchAsync = require('../utils/catchAsync');
const prisma = require('../config/prisma');

// @desc    Add or update review for a partner gym (Gated: requires purchased plan + check-in history)
// @route   POST /api/member-portal/gyms/:id/reviews
// @access  Private/Member
const addGymReview = catchAsync(async (req, res, next) => {
  const { id: gymId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
  }

  // 1. Load member profile
  let member = null;
  if (req.user?.memberId) {
    member = await prisma.member.findUnique({ where: { id: req.user.memberId } });
  }
  if (!member && req.user?.email) {
    member = await prisma.member.findFirst({ where: { email: req.user.email } });
  }

  if (!member) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized: Active member profile required to review gyms.',
    });
  }

  // 2. Gate check A: Purchased a plan?
  const hasPlan = (member.sessionsTotal || 0) > 0 || (member.planId && member.planId.trim().length > 0);
  if (!hasPlan) {
    return res.status(403).json({
      success: false,
      message: 'Only members with an active or past FitPass plan can write reviews.',
    });
  }

  // 3. Gate check B: Checked in / visited this gym at least once?
  const visitCount = await prisma.fitPassAuditLog.count({
    where: {
      memberId: member.id,
      gymIdVisited: gymId,
      accessStatus: 'Success',
    },
  });

  const sessionVisitCount = await prisma.sessionCheckIn.count({
    where: {
      memberId: member.id,
      gymId: gymId,
    },
  });

  const hasVisited = visitCount > 0 || sessionVisitCount > 0;
  if (!hasVisited) {
    return res.status(403).json({
      success: false,
      message: 'Review locked: You must check in at this gym at least once before rating your experience.',
    });
  }

  // 4. Create or update review
  const existingReview = await prisma.review.findFirst({
    where: { gymId, memberId: member.id },
  });

  let review;
  if (existingReview) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating: Number(rating),
        comment: comment || '',
        memberName: member.name || req.user.name || 'Verified Member',
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        gymId,
        memberId: member.id,
        memberName: member.name || req.user.name || 'Verified Member',
        rating: Number(rating),
        comment: comment || '',
      },
    });
  }

  // Calculate updated dynamic average rating
  const agg = await prisma.review.aggregate({
    where: { gymId },
    _avg: { rating: true },
    _count: { id: true },
  });

  return res.status(201).json({
    success: true,
    message: existingReview ? 'Your review has been updated!' : 'Thank you! Your review has been published.',
    review,
    averageRating: parseFloat((agg._avg.rating || rating).toFixed(1)),
    totalReviews: agg._count.id || 1,
  });
});

// @desc    Get all reviews, user review, and average rating for a partner gym
// @route   GET /api/member-portal/gyms/:id/reviews
// @access  Public / Member
const getGymReviews = catchAsync(async (req, res, next) => {
  const { id: gymId } = req.params;

  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.review.aggregate({
      where: { gymId },
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  let myReview = null;
  if (req.user) {
    let member = null;
    if (req.user.memberId) {
      member = await prisma.member.findUnique({ where: { id: req.user.memberId } });
    }
    if (!member && req.user.email) {
      member = await prisma.member.findFirst({ where: { email: req.user.email } });
    }
    if (member) {
      myReview = await prisma.review.findFirst({
        where: { gymId, memberId: member.id },
      });
    }
  }

  const averageRating = agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : 4.8;
  const totalReviews = agg._count.id || 0;

  return res.json({
    success: true,
    reviews,
    averageRating,
    totalReviews,
    myReview: myReview || null,
  });
});

module.exports = {
  addGymReview,
  getGymReviews,
};
