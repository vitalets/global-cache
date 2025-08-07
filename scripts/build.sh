#!/bin/bash

# Exit on any error
set -euo pipefail

rm -rf ./dist
npx tsc -p tsconfig.build.json

# copy 'dist' to 'examples/node_modules/' to allow bare import from '@vitalets/global-cache' in examples.
rm -rf ./examples/node_modules/@vitalets/global-cache
mkdir -p ./examples/node_modules/@vitalets/global-cache
cp -R ./dist ./examples/node_modules/@vitalets/global-cache/
cp ./package.json ./examples/node_modules/@vitalets/global-cache/