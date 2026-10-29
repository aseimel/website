#!/usr/bin/env python3
"""Serve the website locally, including the CSV files used by the charts."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    handler = partial(
        SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent)
    )
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Website preview: http://127.0.0.1:{server.server_port}/", flush=True)
        print("Press Ctrl+C to stop.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
