import prisma from "../config/prismaClient";
import { ActivityAction, TripOfferStatus } from "@prisma/client";
import { listPendingOffersForDriver } from "../repositories/tripOffer.repository";
import {
  ALERT_DEFAULTS,
  ALERT_MESSAGES,
  ALERT_TITLES,
  ALERT_TYPES,
  DRIVER_ALERT_ACTIVITY_ACTIONS,
  type AlertType,
} from "../constants/alerts";

export type DriverAlertItem = {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  createdAt: Date;
  tripId?: string;
  offerId?: string;
  metadata?: any;
};

function mapActivityActionToAlertType(action: ActivityAction): AlertType | null {
  switch (action) {
    case ActivityAction.TRIP_ACCEPTED:
      return ALERT_TYPES.TRIP_ACCEPTED;
    case ActivityAction.TRIP_REJECTED:
      return ALERT_TYPES.TRIP_REJECTED;
    case ActivityAction.TRIP_STARTED:
      return ALERT_TYPES.RIDE_STARTED;
    case ActivityAction.TRIP_ENDED:
      return ALERT_TYPES.RIDE_ENDED;
    default:
      return null;
  }
}

export async function getDriverAlerts(driverId: string, limitEvents?: number) {
  const take = limitEvents ?? ALERT_DEFAULTS.EVENTS_LIMIT;

  const [pendingOffers, activityLogs] = await Promise.all([
    listPendingOffersForDriver(driverId),
    prisma.activityLog.findMany({
      where: {
        driverId,
        action: { in: [...DRIVER_ALERT_ACTIVITY_ACTIONS] },
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        Trip: {
          select: {
            id: true,
            customerName: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const offerItems: DriverAlertItem[] = pendingOffers
    .filter((o) => o.status === TripOfferStatus.OFFERED)
    .map((offer) => ({
      id: offer.id,
      type: ALERT_TYPES.INCOMING_REQUEST,
      title: ALERT_TITLES.INCOMING_REQUEST,
      message: ALERT_MESSAGES.INCOMING_REQUEST,
      createdAt: offer.offeredAt,
      tripId: offer.tripId,
      offerId: offer.id,
      metadata: {
        expiresAt: offer.expiresAt,
        trip: offer.Trip,
      },
    }));

  const activityItems: DriverAlertItem[] = activityLogs
    .map((log) => {
      const type = mapActivityActionToAlertType(log.action);
      if (!type) return null;

      const title =
        type === ALERT_TYPES.TRIP_ACCEPTED
          ? ALERT_TITLES.TRIP_ACCEPTED
          : type === ALERT_TYPES.TRIP_REJECTED
            ? ALERT_TITLES.TRIP_REJECTED
            : type === ALERT_TYPES.RIDE_STARTED
              ? ALERT_TITLES.RIDE_STARTED
              : ALERT_TITLES.RIDE_ENDED;

      const message =
        type === ALERT_TYPES.TRIP_ACCEPTED
          ? ALERT_MESSAGES.TRIP_ACCEPTED
          : type === ALERT_TYPES.TRIP_REJECTED
            ? ALERT_MESSAGES.TRIP_REJECTED
            : type === ALERT_TYPES.RIDE_STARTED
              ? ALERT_MESSAGES.RIDE_STARTED
              : ALERT_MESSAGES.RIDE_ENDED;

      return {
        id: log.id,
        type,
        title,
        message,
        createdAt: log.createdAt,
        tripId: log.tripId ?? undefined,
        metadata: {
          action: log.action,
          description: log.description,
          trip: log.Trip ?? undefined,
          ...(log.metadata ? { meta: log.metadata } : {}),
        },
      } satisfies DriverAlertItem;
    })
    .filter((x): x is DriverAlertItem => Boolean(x));

  const items = [...offerItems, ...activityItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return {
    items,
    counts: {
      incomingRequests: offerItems.length,
      recentEvents: activityItems.length,
      total: items.length,
    },
  };
}

