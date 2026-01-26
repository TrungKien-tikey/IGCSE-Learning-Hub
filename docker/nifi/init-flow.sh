#!/bin/bash

set -e

NIFI_URL="https://nifi:8443"
FLOW_FILE="/flow.json.gz"
NIFI_USER="admin"
NIFI_PASS="thinhnguyen123"
MAX_WAIT=300
WAIT_INTERVAL=10

echo "=========================================="
echo "NiFi Flow Auto-Import Script"
echo "=========================================="
echo ""

# Chờ NiFi sẵn sàng (init container đã chờ healthcheck, nhưng vẫn kiểm tra lại)
echo "Waiting for NiFi API to be ready..."
elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
    if curl -k -f -u "${NIFI_USER}:${NIFI_PASS}" \
        "${NIFI_URL}/nifi-api/system-diagnostics" > /dev/null 2>&1; then
        echo "✅ NiFi API is ready! (waited ${elapsed}s)"
        break
    fi
    if [ $((elapsed % 30)) -eq 0 ]; then
        echo "⏳ Waiting for NiFi API... (${elapsed}s/${MAX_WAIT}s)"
    fi
    sleep $WAIT_INTERVAL
    elapsed=$((elapsed + WAIT_INTERVAL))
done

if [ $elapsed -ge $MAX_WAIT ]; then
    echo "❌ ERROR: NiFi API did not become ready in time"
    exit 1
fi

# Kiểm tra file flow có tồn tại không
if [ ! -f "$FLOW_FILE" ]; then
    echo "⚠️  WARNING: Flow file not found at ${FLOW_FILE}"
    echo "   Skipping flow import..."
    exit 0
fi

echo ""
echo "Reading flow file..."
if [ "${FLOW_FILE##*.}" = "gz" ]; then
    # File là .gz, cần giải nén
    FLOW_CONTENT=$(gunzip -c "$FLOW_FILE")
else
    FLOW_CONTENT=$(cat "$FLOW_FILE")
fi

if [ -z "$FLOW_CONTENT" ]; then
    echo "❌ ERROR: Flow file is empty"
    exit 1
fi

echo "✅ Flow file read successfully"
echo ""

# Lấy root process group ID
echo "Getting root process group ID..."
ROOT_PG_RESPONSE=$(curl -k -s -u "${NIFI_USER}:${NIFI_PASS}" \
    "${NIFI_URL}/nifi-api/flow/process-groups/root")

ROOT_PG_ID=$(echo "$ROOT_PG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ROOT_PG_ID" ]; then
    echo "❌ ERROR: Could not get root process group ID"
    echo "Response: $ROOT_PG_RESPONSE"
    exit 1
fi

echo "✅ Root process group ID: ${ROOT_PG_ID}"
echo ""

# Chuẩn bị payload
echo "Preparing flow import payload..."
FLOW_PAYLOAD=$(echo "$FLOW_CONTENT" | jq -c '{version: 0, processGroupRevision: {version: 0}, flowContents: .flowContents}')

if [ -z "$FLOW_PAYLOAD" ]; then
    echo "❌ ERROR: Failed to prepare flow payload"
    exit 1
fi

echo "✅ Flow payload prepared"
echo ""

# Import flow
echo "Importing flow into NiFi..."
IMPORT_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -u "${NIFI_USER}:${NIFI_PASS}" \
    -d "$FLOW_PAYLOAD" \
    "${NIFI_URL}/nifi-api/flow/process-groups/${ROOT_PG_ID}/process-groups/import")

HTTP_CODE=$(echo "$IMPORT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$IMPORT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Flow imported successfully! (HTTP ${HTTP_CODE})"
    echo ""
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    echo "=========================================="
    echo "✅ Import completed successfully!"
    echo "=========================================="
    exit 0
else
    echo "❌ ERROR: Flow import failed (HTTP ${HTTP_CODE})"
    echo "Response:"
    echo "$RESPONSE_BODY"
    exit 1
fi
