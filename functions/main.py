# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app
import math
import time

initialize_app()

@https_fn.on_request()
def analyze_emotion(req: https_fn.Request) -> https_fn.Response:
    return {"emotion": "Happy", "timestamp": math.floor(time.time() * 1000)}