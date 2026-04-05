#!/bin/bash
for file in src/components/ClearConfirmOverlay.tsx src/components/PickerOverlay.tsx src/components/PrivacyOverlay.tsx src/components/ReportOverlay.tsx src/components/TermsOverlay.tsx; do
  sed -i 's/<<<<<<< HEAD//g' $file
  sed -i 's/=======//g' $file
  sed -i 's/>>>>>>> origin\/main//g' $file
  sed -i "s/import { motion } from 'motion\/react';//g" $file
done
