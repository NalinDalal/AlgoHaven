import sys
import base64

code_b64 = sys.argv[1]
code = base64.b64decode(code_b64).decode("utf-8")

input_data = sys.stdin.read()

import io

sys.stdin = io.StringIO(input_data)

exec(code)
