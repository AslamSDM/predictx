import ChatBox from '@/components/ChatBox';

type PaperPageProps = {
    params: Promise<{ id: string }>;
};

export default async function PredictionPage({ params }: PaperPageProps) {
    const { id: predictionId } = await params;
    const username = "User123";

    return (
        <div>
            <h1>Prediction: {predictionId}</h1>
            {/* Your other page content */}

            <ChatBox predictionId={predictionId} username={username} />
        </div>
    );
}