
export interface ConfirmTrailMonthDto{
    email: string;
    fullName: string;
    valueOfTrainings: number;
    nextTraining?: {
        date: string;
        group:string;
        location:string;
        trainer?:string;
    }
}