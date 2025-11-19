#!/bin/bash

shopt -s extglob # Enable extended globbing

if [ "$#" -eq 1 ]; then
    fingerprint="$1"
else
    fingerprint="cb0299969c4a284ba2d84fd1eb6b2d013d5feeb9"
fi

base_url="https://game-assets.clashofclans.com"

# Step 1: Download fingerprint.json
curl -O $base_url/$fingerprint/fingerprint.json

# Step 2: Extract file URLs and SHA from fingerprint.json
file_info=$(grep -Eo '"file":"[^"]+"' fingerprint.json | awk -F'"' '{print $4, $8}')

# Step 3: Download each file from the extracted URLs
while read -r file
do
    # Replace backslashes with forward slashes in the file path
    file=$(echo "$file" | sed 's/\\\//\//g')

    # Check if the file starts with "sc" or "csv", if not, skip it
    if [[ $file == @(csv|logic|localization)/* ]];
    # if [[ $file == @(sc)/* ]];
    then
        # Create the directory if it doesn't exist
        mkdir -p "assets/$(dirname "$file")"

        echo "Downloading $file"
        curl -o "assets/$(dirname "$file")/$(basename "$file")" "$base_url/$fingerprint/$file"
    # else
        # echo "Skipping $file"
    fi
done <<< "$file_info"

echo "Download complete!"
