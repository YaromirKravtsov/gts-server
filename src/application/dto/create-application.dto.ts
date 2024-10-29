export interface CreateApplicationDto{
    playerName: string;
    playerPhone: string;
    playerComment?:string;
    trainingId: number;
    date: Date
}

/* 
{
    "playerName": "Yaromir Kravtsov",
    "playerPhone": "+49111111",
    "playerComment": "playerComment playerComment playerComment",
    "trainingId": 2,
    "date": "2024-10-07T09:00:00.000Z"
}

*/