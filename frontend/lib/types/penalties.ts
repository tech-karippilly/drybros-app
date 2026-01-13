export type PenaltyType = 'PENALTY' | 'DEDUCTION';

export interface Penalty {
    id: number;
    name: string;
    amount: number;
    description?: string;
    type: PenaltyType;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePenaltyInput {
    name: string;
    amount: number;
    description?: string;
    type: PenaltyType;
}

export interface UpdatePenaltyInput extends CreatePenaltyInput {
    id: number;
}

export type PenaltyTargetType = 'DRIVER' | 'STAFF';

export interface ApplyPenaltyInput {
    penaltyId: number;
    targetType: PenaltyTargetType;
    driverId?: number;
    staffId?: string;
    reason: string;
    amount?: number; // Optional override amount
}

export interface DriverPenalty {
    id: number;
    penaltyId: number;
    penalty: Penalty;
    driverId: number;
    driver: {
        id: number;
        firstName: string;
        lastName: string;
        phone: string;
    };
    reason: string;
    amount: number;
    appliedAt: string;
    appliedBy: number;
}

export interface StaffPenalty {
    id: number;
    penaltyId: number;
    penalty: Penalty;
    staffId: string;
    staff: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    reason: string;
    amount: number;
    appliedAt: string;
    appliedBy: number;
}
