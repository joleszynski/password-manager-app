from website.static.templates import create_app
from flask_cors import CORS

app = create_app()

CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Authorization"],
    supports_credentials=False
)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)