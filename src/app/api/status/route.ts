import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!(
    process.env.AZURE_OPENAI_ENDPOINT && 
    process.env.AZURE_OPENAI_API_KEY && 
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  );

  return NextResponse.json({
    azureOpenAIConfigured: isConfigured,
    hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
    hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
    hasDeployment: !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    clientConfigFlag: process.env.NEXT_PUBLIC_AZURE_OPENAI_CONFIGURED
  });
}
