#!/bin/bash

# Create a new worktree with automatic npm install
# Usage: ./scripts/new-worktree.sh <path> <branch-name>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <worktree-path> <branch-name>"
    echo "Example: $0 ../editme-feature-branch feature/my-feature"
    exit 1
fi

WORKTREE_PATH="$1"
BRANCH_NAME="$2"

echo "Creating worktree at $WORKTREE_PATH on branch $BRANCH_NAME..."

# Create the branch and worktree
git checkout -b "$BRANCH_NAME" 2>/dev/null || echo "Branch $BRANCH_NAME already exists"
git checkout main
git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"

# Change to the worktree directory and run npm install
echo "Installing dependencies in new worktree..."
(cd "$WORKTREE_PATH" && npm install)

echo "✅ Worktree ready at $WORKTREE_PATH"
echo "💡 To switch to it: cd $WORKTREE_PATH"