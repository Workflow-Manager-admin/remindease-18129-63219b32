#!/bin/bash
cd /home/kavia/workspace/code-generation/remindease-18129-63219b32/remind_ease
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

