#!/bin/bash
sed -i '/<<<<<<< HEAD/d' src/services/geminiService.ts
sed -i '/=======/d' src/services/geminiService.ts
sed -i '/>>>>>>> origin\/main/d' src/services/geminiService.ts

# We need to keep one version of the error block and remove the other.
# We'll replace the whole block manually to ensure correctness.
