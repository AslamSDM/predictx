import Prediction from "@/components/Prediction";
import { prisma } from "@/lib/prisma";
import { PredictionStatus } from "@prisma/client";

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

    const serializedPrediction = {
        ...predictionData,
        targetPrice: predictionData.targetPrice!.toString(),
        entryPrice: predictionData.entryPrice!.toString(),
        totalPool: predictionData.totalPool.toString(),
        yesPool: predictionData.yesPool.toString(),
        noPool: predictionData.noPool.toString(),
    };

    return (
        <>
            <Prediction data={serializedPrediction} />
        </>
    )
}