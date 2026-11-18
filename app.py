from flask import Flask, jsonify, render_template
from werkzeug.exceptions import HTTPException

from routes.graph_routes import graph_api

app = Flask(__name__)
app.register_blueprint(graph_api)


@app.get("/")
def index():
    """Menampilkan halaman utama aplikasi."""
    return render_template("index.html")


def _json_error(message, status_code):
    """Membuat response error JSON dengan format yang konsisten."""
    return jsonify({
        "success": False,
        "error": {"message": message},
    }), status_code


@app.errorhandler(404)
def handle_not_found(error):
    """Endpoint tidak ditemukan."""
    return _json_error("Endpoint tidak ditemukan.", 404)


@app.errorhandler(405)
def handle_method_not_allowed(error):
    """Metode HTTP tidak diizinkan untuk endpoint tersebut."""
    return _json_error(
        "Metode HTTP tidak diizinkan untuk endpoint ini.", 405
    )


@app.errorhandler(415)
def handle_unsupported_media_type(error):
    """Content-Type request tidak didukung."""
    return _json_error("Content-Type harus application/json.", 415)


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    """Menangani error tak terduga tanpa membocorkan detail internal."""
    if isinstance(error, HTTPException):
        return _json_error(error.description, error.code)

    # Detail exception hanya dicatat di log server, tidak dikirim ke client.
    app.logger.exception("Terjadi kesalahan internal pada server.")
    return _json_error("Terjadi kesalahan pada server.", 500)


if __name__ == "__main__":
    app.run(debug=True)
