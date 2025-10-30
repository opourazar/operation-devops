export const scenarioScript = [
  {
    id: 1,
    story: " Your colleague, Ben, asks for your help. His Dockerfile doesn’t build correctly. To avoid interfering with the main branch, you decide to create and switch to a new feature branch.",
    expected: ["git checkout -b", "git switch -c"],
    hint: "💡 Remember: use 'git checkout -b <branch>' or 'git switch -c <branch>' to create and move to a new branch.",
    success: "🪄 Branch 'feature/fix-dockerfile' created and switched successfully.",
    next: 2,
    learning_focus: "Version control safety — isolate work via branching (Git best practice)."
  },
  {
    id: 2,
    story: "You’re now working safely on your new branch. Let’s inspect the Dockerfile to identify what might be wrong.",
    expected: ["open dockerfile", "code dockerfile"],
    hint: "Hint: type 'open dockerfile' to proceed.",
    success: "📂 Dockerfile opened in the editor.",
    next: 3,
    learning_focus: "Problem identification and contextual understanding."
  },
  {
    id: 3,
    story: "You see the Dockerfile is missing some essential instructions. Fix it and then stage your changes so they’re ready to commit.",
    expected: ["git add .", "git add dockerfile"],
    hint: "💡 Use 'git add .' to stage all modified files.",
    success: "📦 Changes staged for commit.",
    next: 4,
    learning_focus: "Understanding Git’s staging concept and workflow order."
  },
  {
    id: 4,
    story: "Now commit your fix with a meaningful message to keep history clear and professional.",
    expected: ["git commit -m"],
    hint: "💡 Try 'git commit -m \"fix: add CMD instruction\"'.",
    success: "💬 Commit created with message 'fix: add CMD instruction'.",
    next: 5,
    learning_focus: "Semantic commits and documentation of intent."
  },
  {
    id: 5,
    story: "Everything looks good locally! Push your branch to the remote repository and open a pull request for review.",
    expected: ["git push", "git push origin feature/fix-dockerfile"],
    hint: "💡 Use 'git push origin feature/fix-dockerfile' to publish your branch.",
    success: "🚀 Branch pushed to remote. A pull request has been opened for review...",
    next: 6,
    learning_focus: "Remote collaboration workflow (push → PR → review)."
  },
  {
    id: 6,
    story: " Your colleague Leia reviews your changes. They suggest exposing port 3000 so the app can be accessed.",
    expected: ["ok", "continue"],
    hint: "💡 Type 'ok' to acknowledge feedback and continue.",
    success: "💡 Review acknowledged. You’ll update the Dockerfile accordingly in the next step.",
    next: 7,
    learning_focus: "Peer review feedback — iterative improvement and collaboration."
  },
  {
    id: 7,
    story: "After applying Leia’s suggestion, stage, commit, and push your update again.",
    expected: ["git add .", "git commit -m", "git push"],
    hint: "💡 Use 'git add .', 'git commit -m \"fix: expose port 3000\"', and 'git push'.",
    success: "✅ Update pushed successfully. Review passed and merge request approved!",
    next: 8,
    learning_focus: "Incremental improvement cycle — respond to feedback and re-test."
  },
  {
    id: 8,
    story: "⚔️ A new challenge! While you were fixing your Dockerfile, another teammate merged conflicting changes into main. Time to resolve the merge conflict.",
    expected: ["git checkout main", "git merge feature/fix-dockerfile"],
    hint: "💡 Merge your branch into main: 'git checkout main' then 'git merge feature/fix-dockerfile'.",
    success: "⚔️ Merge conflict detected! Open the Dockerfile to resolve it manually.",
    next: 9,
    learning_focus: "Conflict analysis and resolution — understanding concurrent development issues."
  },
  {
    id: 9,
    story: "Resolve the conflict in the Dockerfile and commit the merge fix.",
    expected: ["git add .", "git commit -m"],
    hint: "💡 After resolving, 'git add .' and 'git commit -m \"fix: resolve merge conflict\"'.",
    success: "✅ Merge conflict resolved and committed. The branch is clean!",
    next: 10,
    learning_focus: "Integrating conflict resolution into workflow."
  },
  {
    id: 10,
    story: "🎉 Great job! You’ve successfully collaborated, handled feedback, and managed merge conflicts. Let’s now test the build and deploy process in the CI pipeline.",
    expected: ["run pipeline", "trigger pipeline"],
    hint: "💡 Try 'run pipeline' to simulate CI/CD pipeline execution.",
    success: "🧩 CI pipeline triggered. Monitoring build results...",
    next: null,
    learning_focus: "Understanding the full DevOps loop (build–deploy–monitor)."
  }
];

