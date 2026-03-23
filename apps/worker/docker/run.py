import sys
import base64
import io

code_b64 = sys.argv[1]
input_b64 = sys.argv[2]

code = base64.b64decode(code_b64).decode("utf-8")
input_data = base64.b64decode(input_b64).decode("utf-8")

sys.stdin = io.StringIO(input_data)

exec(code)
