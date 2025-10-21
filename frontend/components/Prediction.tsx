"use client";
import { Prisma } from '@prisma/client';
import React from 'react'

type Prediction = Prisma.PredictionGetPayload<{}>;

type Props = {
    data: Prediction
}

function Prediction({ data }: Props) {
    return (
        <div>Prediction</div>
    )
}

export default Prediction