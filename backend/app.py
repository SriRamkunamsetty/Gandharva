import gradio as gr
import os
import sys
from loguru import logger
from app.core.firebase import db
from app.core.config import settings

def check_system_status():
    status = []
    
    # 1. Firebase Check
    if db:
        status.append("✅ Firebase Admin: Initialized")
    else:
        status.append("❌ Firebase Admin: Failed/Not Configured")
    
    # 2. Environment Variables Check
    required_env = ["FIREBASE_SERVICE_ACCOUNT_JSON", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"]
    missing = [env for env in required_env if not os.getenv(env)]
    if not missing:
        status.append("✅ Environment Secrets: OK")
    else:
        status.append(f"❌ Missing Secrets: {', '.join(missing)}")
        
    # 3. Model Pipeline
    if settings.ENABLE_ML_PIPELINE:
        status.append(f"✅ ML Pipeline: Enabled (Device: {settings.DEVICE})")
    else:
        status.append("⚠️ ML Pipeline: Disabled")
        
    # 4. Storage Check
    if os.path.exists("data"):
        status.append("✅ Local Storage: Available")
    else:
        status.append("⚠️ Local Storage: Missing (Will be created on demand)")
        
    return "\n".join(status)

# Gradio Dashboard
with gr.Blocks(title="Gandharva API Service") as demo:
    gr.Markdown("# 🎶 Gandharva API Status Dashboard")
    gr.Markdown("This Space hosts the Gandharva backend processing engine. It provides the FastAPI endpoints for the Netlify frontend.")
    
    with gr.Row():
        status_box = gr.Textbox(
            label="System Status",
            value=check_system_status(),
            lines=8,
            interactive=False
        )
    
    refresh_btn = gr.Button("Refresh Status")
    refresh_btn.click(fn=check_system_status, outputs=status_box)
    
    gr.Markdown("---")
    gr.Markdown("### Service Info")
    gr.Markdown(f"**Project**: {settings.PROJECT_NAME}")
    gr.Markdown(f"**Version**: v1.0.0")
    gr.Markdown(f"**API Base**: `/api/v1`")

if __name__ == "__main__":
    from fastapi import FastAPI
    from app.main import app as fastapi_app
    import uvicorn
    
    # Prioritize FastAPI: Mount Gradio onto the existing FastAPI app
    # This ensures FastAPI handles /api/v1 first before falling through to Gradio
    app = gr.mount_gradio_app(fastapi_app, demo, path="/")
    
    # Start uvicorn with the prioritized FastAPI app
    uvicorn.run(app, host="0.0.0.0", port=7860)
