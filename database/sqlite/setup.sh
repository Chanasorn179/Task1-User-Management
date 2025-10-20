#!/bin/bash
echo "🗄️ Setting up SQLite Database..."

DB_PATH="wallboard.db"

if [ -f "$DB_PATH" ]; then
    echo "⚠️  Existing database found. Removing..."
    rm "$DB_PATH"
fi

echo "📐 Creating database schema..."
sqlite3 "$DB_PATH" < init.sql
if [ $? -ne 0 ]; then
    echo "❌ Failed to create schema"
    exit 1
fi

echo "📊 Inserting sample data..."
sqlite3 "$DB_PATH" < sample_data.sql
if [ $? -ne 0 ]; then
    echo "❌ Failed to insert sample data"
    exit 1
fi

echo "🔍 Verifying data..."
AGENT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM agents;")
TEAM_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM teams;")
CONFIG_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM system_config;")

echo "✅ SQLite Database setup completed!"
echo "📊 Summary:"
echo "   - Teams: $TEAM_COUNT"
echo "   - Agents: $AGENT_COUNT"
echo "   - Configs: $CONFIG_COUNT"
echo ""
echo "📁 Database location: $(pwd)/$DB_PATH"
