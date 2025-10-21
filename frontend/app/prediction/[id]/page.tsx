import Prediction from "@/components/Prediction";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type PaperPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ExamPage({ params }: PaperPageProps) {
    const { id: predictionId } = await params;

    const predictionData = await prisma.prediction.findUnique({
        where: {
            id: predictionId
        }
    });

    if (!predictionData) {
        return <>No such prediction</>
    }


    return (
        <>
            <Prediction data={predictionData} />
        </>
    )
}