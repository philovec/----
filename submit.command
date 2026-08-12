#!/bin/bash
SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR
source venv/bin/activate
caffeinate python3 -u submit.py