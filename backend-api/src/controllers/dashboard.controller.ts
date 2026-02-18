import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prismaClient';
import { getDashboardMetrics } from "../services/dashboard.service";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // Basic counts
    const [driverCount, staffCount, customerCount, activeTripCount] = await Promise.all([
      prisma.driver.count(),
      prisma.staff.count(),
      prisma.customer.count(),
      prisma.trip.count({ where: { status: 'active' } })
    ]);

    // Check admin
    const isAdmin = req.user && req.user.role === 'admin';
    let franchiseCount = 0;
    let profitThisMonth = 0;
    let franchisePerformance: any[] = [];

    if (isAdmin) {
      franchiseCount = await prisma.franchise.count();
      // Calculate profit for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);
      profitThisMonth = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'profit',
          createdAt: { gte: startOfMonth }
        }
      }).then(r => r._sum.amount || 0);
      // Franchise performance
      const franchises = await prisma.franchise.findMany({
        where: { isActive: true },
        include: {
          ratings: true,
          transactions: {
            where: {
              type: 'profit',
              createdAt: { gte: startOfMonth }
            }
          }
        }
      });
      franchisePerformance = franchises.map(f => ({
        id: f.id,
        name: f.name,
        avgRating: f.ratings.length ? f.ratings.reduce((a,b) => a+b.value,0)/f.ratings.length : null,
        profit: f.transactions.reduce((a,b) => a+b.amount,0)
      }));
    }

    res.json({
      driverCount,
      staffCount,
      customerCount,
      activeTripCount,
      ...(isAdmin && {
        franchiseCount,
        profitThisMonth,
        franchisePerformance
      })
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary', details: error });
  }
};

/**
 * Get dashboard metrics
 */
export async function getDashboardMetricsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const metrics = await getDashboardMetrics();
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}


export async function getAdminDashboardHandler(req:Request,res:Response){
  try{
    const user = req.user;
    if(!user){
      return res.status(401).json({error:'Unauthorized'});
    }

    const userDetails = await prisma.user.findFirst({where: {id:user.userId}})
    const franchiseId =  userDetails.franchiseId;

    const customersCount =await prisma.user.count({where:{role:'CUSTOMER',franchiseId}});
    const driversCount =await prisma.user.count({where:{role:'DRIVER',franchiseId}});
    const completedTripsCount = await prisma.trip.count({where:{status:'COMPLETED',franchiseId}});
    const pendingTripsCount = await prisma.trip.count({where:{status:'TRIP_PROGRESS',franchiseId}});
    const cancelledTripsCount = await prisma.trip.count({where:{status:'CANCELLED_BY_CUSTOMER',franchiseId}});

    return res.status(200).json({data:{customersCount,driversCount,completedTripsCount,pendingTripsCount,cancelledTripsCount}})
    
  }catch(err){
    return res.status(500).json({message:err.message})
  }
}
