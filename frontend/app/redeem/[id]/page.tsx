import Prediction from "@/components/Prediction";
import { prisma } from "@/lib/prisma";
import { PredictionStatus } from "@prisma/client";

type PaperPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ExamPage({ params }: PaperPageProps) {
    const { id: predictionId } = await params;

    const data = await prisma.prediction.findUnique({
        where: {
            id: predictionId
        },
        select: {
            address: true
        }
    });

    if (!data) {
        return <>No such prediction</>
    }

    return (
        <>
            <Prediction address={data.address} />
        </>
    )
}