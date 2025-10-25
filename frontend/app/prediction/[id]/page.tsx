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
      id: predictionId,
    },
  });

  if (!predictionData) {
    return <>No such prediction</>;
  }

  const serializedPrediction = {
    ...predictionData,
    targetPrice: predictionData.targetPrice?.toString() || "0",
    entryPrice: predictionData.entryPrice?.toString() || "0",
    totalPool: predictionData.totalPool?.toString() || "0",
    yesPool: predictionData.yesPool?.toString() || "0",
    noPool: predictionData.noPool?.toString() || "0",
  };

  return (
    <>
      <Prediction data={serializedPrediction} />
    </>
  );
}
