export const scenarioScript = [
  {
    id: 1,
    story: " Your colleague, Ben, asks for your help. His Dockerfile doesn’t build correctly. To avoid interfering with the main branch, you decide to create and switch to a new feature branch.",
    expected: ["git checkout -b", "git switch -c"],
    hint: " Remember: use 'git checkout -b <branch>' or 'git switch -c <branch>' to create and move to a new branch.",
    success: "Branch 'feature/fix-dockerfile' created and switched successfully.",
    next: 2,
    learning_focus: "Version control safety — isolate work via branching (Git best practice)."
  },
  {
    id: 2,
    story: "You’re now working safely on your new branch. Let’s inspect the Dockerfile to identify what might be wrong (type 'open dockerfile').",
    expected: ["open dockerfile", "code dockerfile"],
    hint: "Type 'open dockerfile' to proceed.",
    success: "📂 Dockerfile opened in the editor.",
    next: 3,
    learning_focus: "Problem identification and contextual understanding."
  },
  {
    id: 3,
    story: "You see the Dockerfile is missing some essential instructions. Fix it and then stage your changes so they’re ready to commit.",
    sequence: ["git add ."],
    hint: "Use 'git add .' to stage all modified files.",
    success: "Changes staged for commit.",
    next: 4,
    learning_focus: "Understanding Git’s staging concept and workflow order."
  },
  {
    id: 4,
    story: "Now commit your fix with a meaningful message to keep history clear and professional.",
    sequence: ["git commit -m"],
    hint: "Try 'git commit -m \"Your message\"'.",
    success: "Commit successful! Your changes are now recorded locally.",
    next: 5,
    learning_focus: "Semantic commits and documentation of intent — each commit should describe what changed and why."
  },
  {
    id: 5,
    story: "Excellent! Your fix is committed locally. Now push your branch to the remote repository to share it with the team.",
    sequence: ["git push origin <your-branch>"],
    hint: "Use 'git push origin <your-branch>' to publish your branch.",
    success: "Branch pushed to remote...",
    next: 6,
    learning_focus: "Remote collaboration workflow — pushing code."
  },
  {
    id: 6,
    story: "Your colleague Leia reviews your pull request and gives you feedback.",
    expected: ["ok", "continue"],
    hint: "Type 'ok' or 'continue' to acknowledge feedback and continue.",
    success: "Review acknowledged. You'll update the Dockerfile accordingly in the next step.",
    next: 7,
    learning_focus: "Peer review feedback — iterative improvement and communication with collaborators."
  },
  {
    id: 7,
    story: "Make Leia’s suggested change by exposing port 3000, then stage, commit, and push your update again for approval.",
    expected: ["git add .", "git commit -m", "git push"],
    hint: "Use 'git add .', then 'git commit -m \"e.g., fix: expose port 3000\"', and finally 'git push origin <your-branch>'.",
    success: "Update pushed successfully. Leia approved your pull request — ready to merge!",
    next: 8,
    learning_focus: "Incorporating review feedback — demonstrating continuous improvement and professionalism."
  },
  {
    id: 8,
    story: "Another teammate merged new changes into main while you were working on your branch. To keep your work up-to-date, merge main into your branch and resolve any conflicts that appear.",
    expected: ["git fetch", "git merge main"],
    hint: "Run 'git fetch' to get the latest updates, then 'git merge main' to bring those changes into your branch.",
    success: "Merge conflict detected in Dockerfile! Conflict markers have appeared in your editor — resolve them before continuing.",
    next: 9,
    learning_focus: "Real-world branching workflow — synchronizing your feature branch with main and handling merge conflicts."
  },
  {
    id: 9,
    story: "You see conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in the Dockerfile. Resolve them manually by keeping the correct lines, then stage, commit, and push your resolved changes back to main.",
    expected: ["git add .", "git commit -m", "git push origin main"],
    hint: "After resolving, run 'git add .', then 'git commit -m \"fix: resolve merge conflict\"', and finally 'git push origin main'.",
    success: "Merge conflict resolved and pushed successfully. Your branch is now synchronized with main and ready for the CI pipeline!",
    next: 10,
    learning_focus: "Conflict resolution and synchronization — merging fixes into main safely and responsibly."
  },
  {
    id: 10,
    story: "Great job! You’ve successfully collaborated, handled feedback, and managed merge conflicts. Now that the Dockerfile is fixed, our pipeline can trigger a build (usually automatically in platforms like GitHub, but here we type 'run pipeline'). Once the build completes, scroll down to complete your reflection to finish this module.",
    expected: ["run pipeline", "trigger pipeline"],
    hint: "Try 'run pipeline' to simulate CI/CD pipeline execution.",
    success: "CI pipeline triggered. Monitoring build results...",
    next: null,
    learning_focus: "Understanding the full DevOps loop (build–deploy–monitor)."
  }
];

