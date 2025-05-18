#!/bin/bash

# ============ CONFIG ============
PROJECT_ID="Lychee"
SERVICE_NAME="lychee-backend"
REGION="us-central1"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"
MONGO_URI="mongodb+srv://linhhoangnguyenngocduy:zZPTeyJzsNyjWheP@lychee.rhhuoxu.mongodb.net/"
JWT_SECRET="LYCHEE_SECRET"
# =================================

echo "🚀 Building Docker image..."
gcloud builds submit --tag $IMAGE

echo "📤 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URI=$MONGO_URI,JWT_SECRET=$JWT_SECRET"

echo "✅ Deployment complete!"
