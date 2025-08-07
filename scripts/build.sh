#!/bin/bash

# Exit on any error
set -euo pipefail

rm -rf ./dist
npx tsc -p tsconfig.build.json

# copy 'dist' to 'examples/node_modules/' to allow bare import from 'parallel-storage' in examples.
rm -rf ./examples/node_modules/parallel-storage
mkdir -p ./examples/node_modules/parallel-storage
cp -R ./dist ./examples/node_modules/parallel-storage/
cp ./package.json ./examples/node_modules/parallel-storage/