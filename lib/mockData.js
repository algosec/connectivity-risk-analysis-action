"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskAnalysisMock = exports.terraformPlanFileMock = exports.githubEventPayloadMock = void 0;
exports.githubEventPayloadMock = {
    "action": "synchronize",
    "after": "4c90a0cd96127b49dad891f57ec792c9d2f0583d",
    "before": "26a2d550a548830df98f864938b735b92a3ee19a",
    "number": 1,
    "organization": {
        "avatar_url": "https://avatars.githubusercontent.com/u/110526486?v=4",
        "description": null,
        "events_url": "https://api.github.com/orgs/alonnalgoDevSecOps/events",
        "hooks_url": "https://api.github.com/orgs/alonnalgoDevSecOps/hooks",
        "id": 110526486,
        "issues_url": "https://api.github.com/orgs/alonnalgoDevSecOps/issues",
        "login": "alonnalgoDevSecOps",
        "members_url": "https://api.github.com/orgs/alonnalgoDevSecOps/members{/member}",
        "node_id": "O_kgDOBpaAFg",
        "public_members_url": "https://api.github.com/orgs/alonnalgoDevSecOps/public_members{/member}",
        "repos_url": "https://api.github.com/orgs/alonnalgoDevSecOps/repos",
        "url": "https://api.github.com/orgs/alonnalgoDevSecOps"
    },
    "pull_request": {
        "_links": {
            "comments": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/1/comments"
            },
            "commits": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/1/commits"
            },
            "html": {
                "href": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pull/1"
            },
            "issue": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/1"
            },
            "review_comment": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/comments{/number}"
            },
            "review_comments": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/1/comments"
            },
            "self": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/1"
            },
            "statuses": {
                "href": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/statuses/4c90a0cd96127b49dad891f57ec792c9d2f0583d"
            }
        },
        "active_lock_reason": null,
        "additions": 3,
        "assignee": null,
        "assignees": [],
        "author_association": "CONTRIBUTOR",
        "auto_merge": null,
        "base": {
            "label": "alonnalgoDevSecOps:main",
            "ref": "main",
            "repo": {
                "allow_auto_merge": false,
                "allow_forking": false,
                "allow_merge_commit": true,
                "allow_rebase_merge": true,
                "allow_squash_merge": true,
                "allow_update_branch": false,
                "archive_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/{archive_format}{/ref}",
                "archived": false,
                "assignees_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/assignees{/user}",
                "blobs_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/blobs{/sha}",
                "branches_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/branches{/branch}",
                "clone_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
                "collaborators_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/collaborators{/collaborator}",
                "comments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/comments{/number}",
                "commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/commits{/sha}",
                "compare_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/compare/{base}...{head}",
                "contents_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/contents/{+path}",
                "contributors_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/contributors",
                "created_at": "2022-08-03T08:02:17Z",
                "default_branch": "main",
                "delete_branch_on_merge": false,
                "deployments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/deployments",
                "description": null,
                "disabled": false,
                "downloads_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/downloads",
                "events_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/events",
                "fork": false,
                "forks": 0,
                "forks_count": 0,
                "forks_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/forks",
                "full_name": "alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "git_commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/commits{/sha}",
                "git_refs_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/refs{/sha}",
                "git_tags_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/tags{/sha}",
                "git_url": "git://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
                "has_downloads": true,
                "has_issues": true,
                "has_pages": false,
                "has_projects": true,
                "has_wiki": true,
                "homepage": null,
                "hooks_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/hooks",
                "html_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "id": 520790105,
                "is_template": false,
                "issue_comment_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/comments{/number}",
                "issue_events_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/events{/number}",
                "issues_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues{/number}",
                "keys_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/keys{/key_id}",
                "labels_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/labels{/name}",
                "language": "HCL",
                "languages_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/languages",
                "license": null,
                "merges_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/merges",
                "milestones_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/milestones{/number}",
                "mirror_url": null,
                "name": "risk-analysis-customer-repo-example",
                "node_id": "R_kgDOHwqgWQ",
                "notifications_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/notifications{?since,all,participating}",
                "open_issues": 1,
                "open_issues_count": 1,
                "owner": {
                    "avatar_url": "https://avatars.githubusercontent.com/u/110526486?v=4",
                    "events_url": "https://api.github.com/users/alonnalgoDevSecOps/events{/privacy}",
                    "followers_url": "https://api.github.com/users/alonnalgoDevSecOps/followers",
                    "following_url": "https://api.github.com/users/alonnalgoDevSecOps/following{/other_user}",
                    "gists_url": "https://api.github.com/users/alonnalgoDevSecOps/gists{/gist_id}",
                    "gravatar_id": "",
                    "html_url": "https://github.com/alonnalgoDevSecOps",
                    "id": 110526486,
                    "login": "alonnalgoDevSecOps",
                    "node_id": "O_kgDOBpaAFg",
                    "organizations_url": "https://api.github.com/users/alonnalgoDevSecOps/orgs",
                    "received_events_url": "https://api.github.com/users/alonnalgoDevSecOps/received_events",
                    "repos_url": "https://api.github.com/users/alonnalgoDevSecOps/repos",
                    "site_admin": false,
                    "starred_url": "https://api.github.com/users/alonnalgoDevSecOps/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/alonnalgoDevSecOps/subscriptions",
                    "type": "Organization",
                    "url": "https://api.github.com/users/alonnalgoDevSecOps"
                },
                "private": true,
                "pulls_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls{/number}",
                "pushed_at": "2022-08-06T14:31:39Z",
                "releases_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/releases{/id}",
                "size": 444,
                "ssh_url": "git@github.com:alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
                "stargazers_count": 0,
                "stargazers_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/stargazers",
                "statuses_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/statuses/{sha}",
                "subscribers_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/subscribers",
                "subscription_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/subscription",
                "svn_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "tags_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/tags",
                "teams_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/teams",
                "topics": [],
                "trees_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/trees{/sha}",
                "updated_at": "2022-08-04T18:13:37Z",
                "url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "use_squash_pr_title_as_default": false,
                "visibility": "private",
                "watchers": 0,
                "watchers_count": 0,
                "web_commit_signoff_required": false
            },
            "sha": "66307b2e4a590675236aac91373bcd4a42473e60",
            "user": {
                "avatar_url": "https://avatars.githubusercontent.com/u/110526486?v=4",
                "events_url": "https://api.github.com/users/alonnalgoDevSecOps/events{/privacy}",
                "followers_url": "https://api.github.com/users/alonnalgoDevSecOps/followers",
                "following_url": "https://api.github.com/users/alonnalgoDevSecOps/following{/other_user}",
                "gists_url": "https://api.github.com/users/alonnalgoDevSecOps/gists{/gist_id}",
                "gravatar_id": "",
                "html_url": "https://github.com/alonnalgoDevSecOps",
                "id": 110526486,
                "login": "alonnalgoDevSecOps",
                "node_id": "O_kgDOBpaAFg",
                "organizations_url": "https://api.github.com/users/alonnalgoDevSecOps/orgs",
                "received_events_url": "https://api.github.com/users/alonnalgoDevSecOps/received_events",
                "repos_url": "https://api.github.com/users/alonnalgoDevSecOps/repos",
                "site_admin": false,
                "starred_url": "https://api.github.com/users/alonnalgoDevSecOps/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/alonnalgoDevSecOps/subscriptions",
                "type": "Organization",
                "url": "https://api.github.com/users/alonnalgoDevSecOps"
            }
        },
        "body": null,
        "changed_files": 2,
        "closed_at": null,
        "comments": 0,
        "comments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/1/comments",
        "commits": 14,
        "commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/1/commits",
        "created_at": "2022-08-04T18:11:41Z",
        "deletions": 1,
        "diff_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pull/1.diff",
        "draft": false,
        "head": {
            "label": "alonnalgoDevSecOps:CUTOMER-EXAMPLE-PR",
            "ref": "CUTOMER-EXAMPLE-PR",
            "repo": {
                "allow_auto_merge": false,
                "allow_forking": false,
                "allow_merge_commit": true,
                "allow_rebase_merge": true,
                "allow_squash_merge": true,
                "allow_update_branch": false,
                "archive_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/{archive_format}{/ref}",
                "archived": false,
                "assignees_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/assignees{/user}",
                "blobs_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/blobs{/sha}",
                "branches_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/branches{/branch}",
                "clone_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
                "collaborators_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/collaborators{/collaborator}",
                "comments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/comments{/number}",
                "commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/commits{/sha}",
                "compare_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/compare/{base}...{head}",
                "contents_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/contents/{+path}",
                "contributors_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/contributors",
                "created_at": "2022-08-03T08:02:17Z",
                "default_branch": "main",
                "delete_branch_on_merge": false,
                "deployments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/deployments",
                "description": null,
                "disabled": false,
                "downloads_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/downloads",
                "events_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/events",
                "fork": false,
                "forks": 0,
                "forks_count": 0,
                "forks_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/forks",
                "full_name": "alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "git_commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/commits{/sha}",
                "git_refs_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/refs{/sha}",
                "git_tags_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/tags{/sha}",
                "git_url": "git://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
                "has_downloads": true,
                "has_issues": true,
                "has_pages": false,
                "has_projects": true,
                "has_wiki": true,
                "homepage": null,
                "hooks_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/hooks",
                "html_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "id": 520790105,
                "is_template": false,
                "issue_comment_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/comments{/number}",
                "issue_events_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/events{/number}",
                "issues_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues{/number}",
                "keys_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/keys{/key_id}",
                "labels_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/labels{/name}",
                "language": "HCL",
                "languages_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/languages",
                "license": null,
                "merges_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/merges",
                "milestones_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/milestones{/number}",
                "mirror_url": null,
                "name": "risk-analysis-customer-repo-example",
                "node_id": "R_kgDOHwqgWQ",
                "notifications_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/notifications{?since,all,participating}",
                "open_issues": 1,
                "open_issues_count": 1,
                "owner": {
                    "avatar_url": "https://avatars.githubusercontent.com/u/110526486?v=4",
                    "events_url": "https://api.github.com/users/alonnalgoDevSecOps/events{/privacy}",
                    "followers_url": "https://api.github.com/users/alonnalgoDevSecOps/followers",
                    "following_url": "https://api.github.com/users/alonnalgoDevSecOps/following{/other_user}",
                    "gists_url": "https://api.github.com/users/alonnalgoDevSecOps/gists{/gist_id}",
                    "gravatar_id": "",
                    "html_url": "https://github.com/alonnalgoDevSecOps",
                    "id": 110526486,
                    "login": "alonnalgoDevSecOps",
                    "node_id": "O_kgDOBpaAFg",
                    "organizations_url": "https://api.github.com/users/alonnalgoDevSecOps/orgs",
                    "received_events_url": "https://api.github.com/users/alonnalgoDevSecOps/received_events",
                    "repos_url": "https://api.github.com/users/alonnalgoDevSecOps/repos",
                    "site_admin": false,
                    "starred_url": "https://api.github.com/users/alonnalgoDevSecOps/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/alonnalgoDevSecOps/subscriptions",
                    "type": "Organization",
                    "url": "https://api.github.com/users/alonnalgoDevSecOps"
                },
                "private": true,
                "pulls_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls{/number}",
                "pushed_at": "2022-08-06T14:31:39Z",
                "releases_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/releases{/id}",
                "size": 444,
                "ssh_url": "git@github.com:alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
                "stargazers_count": 0,
                "stargazers_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/stargazers",
                "statuses_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/statuses/{sha}",
                "subscribers_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/subscribers",
                "subscription_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/subscription",
                "svn_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "tags_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/tags",
                "teams_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/teams",
                "topics": [],
                "trees_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/trees{/sha}",
                "updated_at": "2022-08-04T18:13:37Z",
                "url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
                "use_squash_pr_title_as_default": false,
                "visibility": "private",
                "watchers": 0,
                "watchers_count": 0,
                "web_commit_signoff_required": false
            },
            "sha": "4c90a0cd96127b49dad891f57ec792c9d2f0583d",
            "user": {
                "avatar_url": "https://avatars.githubusercontent.com/u/110526486?v=4",
                "events_url": "https://api.github.com/users/alonnalgoDevSecOps/events{/privacy}",
                "followers_url": "https://api.github.com/users/alonnalgoDevSecOps/followers",
                "following_url": "https://api.github.com/users/alonnalgoDevSecOps/following{/other_user}",
                "gists_url": "https://api.github.com/users/alonnalgoDevSecOps/gists{/gist_id}",
                "gravatar_id": "",
                "html_url": "https://github.com/alonnalgoDevSecOps",
                "id": 110526486,
                "login": "alonnalgoDevSecOps",
                "node_id": "O_kgDOBpaAFg",
                "organizations_url": "https://api.github.com/users/alonnalgoDevSecOps/orgs",
                "received_events_url": "https://api.github.com/users/alonnalgoDevSecOps/received_events",
                "repos_url": "https://api.github.com/users/alonnalgoDevSecOps/repos",
                "site_admin": false,
                "starred_url": "https://api.github.com/users/alonnalgoDevSecOps/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/alonnalgoDevSecOps/subscriptions",
                "type": "Organization",
                "url": "https://api.github.com/users/alonnalgoDevSecOps"
            }
        },
        "html_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pull/1",
        "id": 1017878839,
        "issue_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/1",
        "labels": [],
        "locked": false,
        "maintainer_can_modify": false,
        "merge_commit_sha": "0d418ef4df00a90c400ce73b722b001a1d518dbb",
        "mergeable": null,
        "mergeable_state": "unknown",
        "merged": false,
        "merged_at": null,
        "merged_by": null,
        "milestone": null,
        "node_id": "PR_kwDOHwqgWc48q5k3",
        "number": 1,
        "patch_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pull/1.patch",
        "rebaseable": null,
        "requested_reviewers": [],
        "requested_teams": [],
        "review_comment_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/comments{/number}",
        "review_comments": 0,
        "review_comments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/1/comments",
        "state": "open",
        "statuses_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/statuses/4c90a0cd96127b49dad891f57ec792c9d2f0583d",
        "title": "CUTOMER EXAMPLE PR 1",
        "updated_at": "2022-08-06T14:31:38Z",
        "url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls/1",
        "user": {
            "avatar_url": "https://avatars.githubusercontent.com/u/97066034?v=4",
            "events_url": "https://api.github.com/users/alonnalgo/events{/privacy}",
            "followers_url": "https://api.github.com/users/alonnalgo/followers",
            "following_url": "https://api.github.com/users/alonnalgo/following{/other_user}",
            "gists_url": "https://api.github.com/users/alonnalgo/gists{/gist_id}",
            "gravatar_id": "",
            "html_url": "https://github.com/alonnalgo",
            "id": 97066034,
            "login": "alonnalgo",
            "node_id": "U_kgDOBckcMg",
            "organizations_url": "https://api.github.com/users/alonnalgo/orgs",
            "received_events_url": "https://api.github.com/users/alonnalgo/received_events",
            "repos_url": "https://api.github.com/users/alonnalgo/repos",
            "site_admin": false,
            "starred_url": "https://api.github.com/users/alonnalgo/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/alonnalgo/subscriptions",
            "type": "User",
            "url": "https://api.github.com/users/alonnalgo"
        }
    },
    "repository": {
        "allow_forking": false,
        "archive_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/{archive_format}{/ref}",
        "archived": false,
        "assignees_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/assignees{/user}",
        "blobs_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/blobs{/sha}",
        "branches_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/branches{/branch}",
        "clone_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
        "collaborators_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/collaborators{/collaborator}",
        "comments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/comments{/number}",
        "commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/commits{/sha}",
        "compare_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/compare/{base}...{head}",
        "contents_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/contents/{+path}",
        "contributors_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/contributors",
        "created_at": "2022-08-03T08:02:17Z",
        "default_branch": "main",
        "deployments_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/deployments",
        "description": null,
        "disabled": false,
        "downloads_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/downloads",
        "events_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/events",
        "fork": false,
        "forks": 0,
        "forks_count": 0,
        "forks_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/forks",
        "full_name": "alonnalgoDevSecOps/risk-analysis-customer-repo-example",
        "git_commits_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/commits{/sha}",
        "git_refs_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/refs{/sha}",
        "git_tags_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/tags{/sha}",
        "git_url": "git://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
        "has_downloads": true,
        "has_issues": true,
        "has_pages": false,
        "has_projects": true,
        "has_wiki": true,
        "homepage": null,
        "hooks_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/hooks",
        "html_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
        "id": 520790105,
        "is_template": false,
        "issue_comment_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/comments{/number}",
        "issue_events_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues/events{/number}",
        "issues_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/issues{/number}",
        "keys_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/keys{/key_id}",
        "labels_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/labels{/name}",
        "language": "HCL",
        "languages_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/languages",
        "license": null,
        "merges_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/merges",
        "milestones_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/milestones{/number}",
        "mirror_url": null,
        "name": "risk-analysis-customer-repo-example",
        "node_id": "R_kgDOHwqgWQ",
        "notifications_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/notifications{?since,all,participating}",
        "open_issues": 1,
        "open_issues_count": 1,
        "owner": {
            "avatar_url": "https://avatars.githubusercontent.com/u/110526486?v=4",
            "events_url": "https://api.github.com/users/alonnalgoDevSecOps/events{/privacy}",
            "followers_url": "https://api.github.com/users/alonnalgoDevSecOps/followers",
            "following_url": "https://api.github.com/users/alonnalgoDevSecOps/following{/other_user}",
            "gists_url": "https://api.github.com/users/alonnalgoDevSecOps/gists{/gist_id}",
            "gravatar_id": "",
            "html_url": "https://github.com/alonnalgoDevSecOps",
            "id": 110526486,
            "login": "alonnalgoDevSecOps",
            "node_id": "O_kgDOBpaAFg",
            "organizations_url": "https://api.github.com/users/alonnalgoDevSecOps/orgs",
            "received_events_url": "https://api.github.com/users/alonnalgoDevSecOps/received_events",
            "repos_url": "https://api.github.com/users/alonnalgoDevSecOps/repos",
            "site_admin": false,
            "starred_url": "https://api.github.com/users/alonnalgoDevSecOps/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/alonnalgoDevSecOps/subscriptions",
            "type": "Organization",
            "url": "https://api.github.com/users/alonnalgoDevSecOps"
        },
        "private": true,
        "pulls_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/pulls{/number}",
        "pushed_at": "2022-08-06T14:31:39Z",
        "releases_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/releases{/id}",
        "size": 444,
        "ssh_url": "git@github.com:alonnalgoDevSecOps/risk-analysis-customer-repo-example.git",
        "stargazers_count": 0,
        "stargazers_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/stargazers",
        "statuses_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/statuses/{sha}",
        "subscribers_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/subscribers",
        "subscription_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/subscription",
        "svn_url": "https://github.com/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
        "tags_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/tags",
        "teams_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/teams",
        "topics": [],
        "trees_url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example/git/trees{/sha}",
        "updated_at": "2022-08-04T18:13:37Z",
        "url": "https://api.github.com/repos/alonnalgoDevSecOps/risk-analysis-customer-repo-example",
        "visibility": "private",
        "watchers": 0,
        "watchers_count": 0,
        "web_commit_signoff_required": false
    },
    "sender": {
        "avatar_url": "https://avatars.githubusercontent.com/u/97066034?v=4",
        "events_url": "https://api.github.com/users/alonnalgo/events{/privacy}",
        "followers_url": "https://api.github.com/users/alonnalgo/followers",
        "following_url": "https://api.github.com/users/alonnalgo/following{/other_user}",
        "gists_url": "https://api.github.com/users/alonnalgo/gists{/gist_id}",
        "gravatar_id": "",
        "html_url": "https://github.com/alonnalgo",
        "id": 97066034,
        "login": "alonnalgo",
        "node_id": "U_kgDOBckcMg",
        "organizations_url": "https://api.github.com/users/alonnalgo/orgs",
        "received_events_url": "https://api.github.com/users/alonnalgo/received_events",
        "repos_url": "https://api.github.com/users/alonnalgo/repos",
        "site_admin": false,
        "starred_url": "https://api.github.com/users/alonnalgo/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/alonnalgo/subscriptions",
        "type": "User",
        "url": "https://api.github.com/users/alonnalgo"
    }
};
exports.terraformPlanFileMock = {
    "format_version": "1.1",
    "terraform_version": "1.2.4",
    "variables": {
        "acm_certificate_arn": {
            "value": ""
        },
        "aliases": {
            "value": []
        },
        "allowed_methods": {
            "value": [
                "DELETE",
                "GET",
                "HEAD",
                "OPTIONS",
                "PATCH",
                "POST",
                "PUT"
            ]
        },
        "allowed_methods_choice": {
            "value": "1"
        },
        "cf_log_bucket": {
            "value": ""
        },
        "cloudfront_default_certificate": {
            "value": "true"
        },
        "cookies": {
            "value": "none"
        },
        "custom_domain_name": {
            "value": "test-bucket"
        },
        "default_root_object": {
            "value": "index.html"
        },
        "default_ttl": {
            "value": "3600"
        },
        "for_test": {
            "value": "test"
        },
        "locations": {
            "value": []
        },
        "logging_bucket_domain_name": {
            "value": ""
        },
        "logging_bucket_prefix": {
            "value": "logs"
        },
        "max_ttl": {
            "value": "86400"
        },
        "min_ttl": {
            "value": "0"
        },
        "origin_path": {
            "value": ""
        },
        "price_class": {
            "value": "PriceClass_All"
        },
        "query_string": {
            "value": false
        },
        "restriction_type": {
            "value": "none"
        },
        "viewer_protocol_policy": {
            "value": "allow-all"
        },
        "webapp_s3_bucket": {
            "value": "this-is-a-test"
        }
    },
    "planned_values": {
        "outputs": {
            "domain_name": {
                "sensitive": false
            }
        },
        "root_module": {
            "resources": [
                {
                    "address": "aws_cloudfront_distribution.cloudfront_distribution",
                    "mode": "managed",
                    "type": "aws_cloudfront_distribution",
                    "name": "cloudfront_distribution",
                    "provider_name": "registry.terraform.io/hashicorp/aws",
                    "schema_version": 1,
                    "values": {
                        "aliases": null,
                        "comment": null,
                        "custom_error_response": [],
                        "default_cache_behavior": [
                            {
                                "allowed_methods": [
                                    "DELETE",
                                    "GET",
                                    "HEAD",
                                    "OPTIONS",
                                    "PATCH",
                                    "POST",
                                    "PUT"
                                ],
                                "cache_policy_id": null,
                                "cached_methods": [
                                    "GET",
                                    "HEAD"
                                ],
                                "compress": false,
                                "default_ttl": 3600,
                                "field_level_encryption_id": null,
                                "forwarded_values": [
                                    {
                                        "cookies": [
                                            {
                                                "forward": "none"
                                            }
                                        ],
                                        "query_string": false
                                    }
                                ],
                                "function_association": [],
                                "lambda_function_association": [],
                                "max_ttl": 86400,
                                "min_ttl": 0,
                                "origin_request_policy_id": null,
                                "realtime_log_config_arn": null,
                                "response_headers_policy_id": null,
                                "smooth_streaming": null,
                                "target_origin_id": "this-is-a-test",
                                "viewer_protocol_policy": "redirect-to-https"
                            }
                        ],
                        "default_root_object": "index.html",
                        "enabled": true,
                        "http_version": "http2",
                        "is_ipv6_enabled": false,
                        "logging_config": [
                            {
                                "bucket": "",
                                "include_cookies": false,
                                "prefix": "logs"
                            }
                        ],
                        "ordered_cache_behavior": [],
                        "origin": [
                            {
                                "connection_attempts": 3,
                                "connection_timeout": 10,
                                "custom_header": [],
                                "custom_origin_config": [],
                                "domain_name": "this-is-a-test",
                                "origin_id": "this-is-a-test/cloudflow",
                                "origin_path": "",
                                "origin_shield": [],
                                "s3_origin_config": []
                            }
                        ],
                        "origin_group": [],
                        "price_class": "PriceClass_All",
                        "restrictions": [
                            {
                                "geo_restriction": [
                                    {
                                        "restriction_type": "none"
                                    }
                                ]
                            }
                        ],
                        "retain_on_delete": false,
                        "tags": null,
                        "viewer_certificate": [
                            {
                                "acm_certificate_arn": "",
                                "cloudfront_default_certificate": null,
                                "iam_certificate_id": null,
                                "minimum_protocol_version": "TLSv1",
                                "ssl_support_method": "sni-only"
                            }
                        ],
                        "wait_for_deployment": true,
                        "web_acl_id": null
                    },
                    "sensitive_values": {
                        "custom_error_response": [],
                        "default_cache_behavior": [
                            {
                                "allowed_methods": [
                                    false,
                                    false,
                                    false,
                                    false,
                                    false,
                                    false,
                                    false
                                ],
                                "cached_methods": [
                                    false,
                                    false
                                ],
                                "forwarded_values": [
                                    {
                                        "cookies": [
                                            {
                                                "whitelisted_names": []
                                            }
                                        ],
                                        "headers": [],
                                        "query_string_cache_keys": []
                                    }
                                ],
                                "function_association": [],
                                "lambda_function_association": [],
                                "trusted_key_groups": [],
                                "trusted_signers": []
                            }
                        ],
                        "logging_config": [
                            {}
                        ],
                        "ordered_cache_behavior": [],
                        "origin": [
                            {
                                "custom_header": [],
                                "custom_origin_config": [],
                                "origin_shield": [],
                                "s3_origin_config": []
                            }
                        ],
                        "origin_group": [],
                        "restrictions": [
                            {
                                "geo_restriction": [
                                    {
                                        "locations": []
                                    }
                                ]
                            }
                        ],
                        "tags_all": {},
                        "trusted_key_groups": [],
                        "trusted_signers": [],
                        "viewer_certificate": [
                            {}
                        ]
                    }
                },
                {
                    "address": "aws_security_group.devsecops_test",
                    "mode": "managed",
                    "type": "aws_security_group",
                    "name": "devsecops_test",
                    "provider_name": "registry.terraform.io/hashicorp/aws",
                    "schema_version": 1,
                    "values": {
                        "description": "Display devsecops ",
                        "egress": [
                            {
                                "cidr_blocks": [
                                    "10.20.30.0/24"
                                ],
                                "description": "",
                                "from_port": 7654,
                                "ipv6_cidr_blocks": [],
                                "prefix_list_ids": [],
                                "protocol": "-1",
                                "security_groups": [],
                                "self": false,
                                "to_port": 7655
                            }
                        ],
                        "ingress": [
                            {
                                "cidr_blocks": [
                                    "172.31.0.0/16"
                                ],
                                "description": "web app",
                                "from_port": 80,
                                "ipv6_cidr_blocks": [],
                                "prefix_list_ids": [],
                                "protocol": "tcp",
                                "security_groups": [],
                                "self": false,
                                "to_port": 8082
                            }
                        ],
                        "name": "devsecops_test",
                        "revoke_rules_on_delete": false,
                        "tags": {
                            "Name": "cool_application"
                        },
                        "tags_all": {
                            "Name": "cool_application"
                        },
                        "timeouts": null,
                        "vpc_id": "vpc-12345678"
                    },
                    "sensitive_values": {
                        "egress": [
                            {
                                "cidr_blocks": [
                                    false
                                ],
                                "ipv6_cidr_blocks": [],
                                "prefix_list_ids": [],
                                "security_groups": []
                            }
                        ],
                        "ingress": [
                            {
                                "cidr_blocks": [
                                    false
                                ],
                                "ipv6_cidr_blocks": [],
                                "prefix_list_ids": [],
                                "security_groups": []
                            }
                        ],
                        "tags": {},
                        "tags_all": {}
                    }
                }
            ]
        }
    },
    "resource_changes": [
        {
            "address": "aws_cloudfront_distribution.cloudfront_distribution",
            "mode": "managed",
            "type": "aws_cloudfront_distribution",
            "name": "cloudfront_distribution",
            "provider_name": "registry.terraform.io/hashicorp/aws",
            "change": {
                "actions": [
                    "create"
                ],
                "before": null,
                "after": {
                    "aliases": null,
                    "comment": null,
                    "custom_error_response": [],
                    "default_cache_behavior": [
                        {
                            "allowed_methods": [
                                "DELETE",
                                "GET",
                                "HEAD",
                                "OPTIONS",
                                "PATCH",
                                "POST",
                                "PUT"
                            ],
                            "cache_policy_id": null,
                            "cached_methods": [
                                "GET",
                                "HEAD"
                            ],
                            "compress": false,
                            "default_ttl": 3600,
                            "field_level_encryption_id": null,
                            "forwarded_values": [
                                {
                                    "cookies": [
                                        {
                                            "forward": "none"
                                        }
                                    ],
                                    "query_string": false
                                }
                            ],
                            "function_association": [],
                            "lambda_function_association": [],
                            "max_ttl": 86400,
                            "min_ttl": 0,
                            "origin_request_policy_id": null,
                            "realtime_log_config_arn": null,
                            "response_headers_policy_id": null,
                            "smooth_streaming": null,
                            "target_origin_id": "this-is-a-test",
                            "viewer_protocol_policy": "redirect-to-https"
                        }
                    ],
                    "default_root_object": "index.html",
                    "enabled": true,
                    "http_version": "http2",
                    "is_ipv6_enabled": false,
                    "logging_config": [
                        {
                            "bucket": "",
                            "include_cookies": false,
                            "prefix": "logs"
                        }
                    ],
                    "ordered_cache_behavior": [],
                    "origin": [
                        {
                            "connection_attempts": 3,
                            "connection_timeout": 10,
                            "custom_header": [],
                            "custom_origin_config": [],
                            "domain_name": "this-is-a-test",
                            "origin_id": "this-is-a-test/cloudflow",
                            "origin_path": "",
                            "origin_shield": [],
                            "s3_origin_config": []
                        }
                    ],
                    "origin_group": [],
                    "price_class": "PriceClass_All",
                    "restrictions": [
                        {
                            "geo_restriction": [
                                {
                                    "restriction_type": "none"
                                }
                            ]
                        }
                    ],
                    "retain_on_delete": false,
                    "tags": null,
                    "viewer_certificate": [
                        {
                            "acm_certificate_arn": "",
                            "cloudfront_default_certificate": null,
                            "iam_certificate_id": null,
                            "minimum_protocol_version": "TLSv1",
                            "ssl_support_method": "sni-only"
                        }
                    ],
                    "wait_for_deployment": true,
                    "web_acl_id": null
                },
                "after_unknown": {
                    "arn": true,
                    "caller_reference": true,
                    "custom_error_response": [],
                    "default_cache_behavior": [
                        {
                            "allowed_methods": [
                                false,
                                false,
                                false,
                                false,
                                false,
                                false,
                                false
                            ],
                            "cached_methods": [
                                false,
                                false
                            ],
                            "forwarded_values": [
                                {
                                    "cookies": [
                                        {
                                            "whitelisted_names": true
                                        }
                                    ],
                                    "headers": true,
                                    "query_string_cache_keys": true
                                }
                            ],
                            "function_association": [],
                            "lambda_function_association": [],
                            "trusted_key_groups": true,
                            "trusted_signers": true
                        }
                    ],
                    "domain_name": true,
                    "etag": true,
                    "hosted_zone_id": true,
                    "id": true,
                    "in_progress_validation_batches": true,
                    "last_modified_time": true,
                    "logging_config": [
                        {}
                    ],
                    "ordered_cache_behavior": [],
                    "origin": [
                        {
                            "custom_header": [],
                            "custom_origin_config": [],
                            "origin_shield": [],
                            "s3_origin_config": []
                        }
                    ],
                    "origin_group": [],
                    "restrictions": [
                        {
                            "geo_restriction": [
                                {
                                    "locations": true
                                }
                            ]
                        }
                    ],
                    "status": true,
                    "tags_all": true,
                    "trusted_key_groups": true,
                    "trusted_signers": true,
                    "viewer_certificate": [
                        {}
                    ]
                },
                "before_sensitive": false,
                "after_sensitive": {
                    "custom_error_response": [],
                    "default_cache_behavior": [
                        {
                            "allowed_methods": [
                                false,
                                false,
                                false,
                                false,
                                false,
                                false,
                                false
                            ],
                            "cached_methods": [
                                false,
                                false
                            ],
                            "forwarded_values": [
                                {
                                    "cookies": [
                                        {
                                            "whitelisted_names": []
                                        }
                                    ],
                                    "headers": [],
                                    "query_string_cache_keys": []
                                }
                            ],
                            "function_association": [],
                            "lambda_function_association": [],
                            "trusted_key_groups": [],
                            "trusted_signers": []
                        }
                    ],
                    "logging_config": [
                        {}
                    ],
                    "ordered_cache_behavior": [],
                    "origin": [
                        {
                            "custom_header": [],
                            "custom_origin_config": [],
                            "origin_shield": [],
                            "s3_origin_config": []
                        }
                    ],
                    "origin_group": [],
                    "restrictions": [
                        {
                            "geo_restriction": [
                                {
                                    "locations": []
                                }
                            ]
                        }
                    ],
                    "tags_all": {},
                    "trusted_key_groups": [],
                    "trusted_signers": [],
                    "viewer_certificate": [
                        {}
                    ]
                }
            }
        },
        {
            "address": "aws_security_group.devsecops_test",
            "mode": "managed",
            "type": "aws_security_group",
            "name": "devsecops_test",
            "provider_name": "registry.terraform.io/hashicorp/aws",
            "change": {
                "actions": [
                    "create"
                ],
                "before": null,
                "after": {
                    "description": "Display devsecops ",
                    "egress": [
                        {
                            "cidr_blocks": [
                                "10.20.30.0/24"
                            ],
                            "description": "",
                            "from_port": 7654,
                            "ipv6_cidr_blocks": [],
                            "prefix_list_ids": [],
                            "protocol": "-1",
                            "security_groups": [],
                            "self": false,
                            "to_port": 7655
                        }
                    ],
                    "ingress": [
                        {
                            "cidr_blocks": [
                                "172.31.0.0/16"
                            ],
                            "description": "web app",
                            "from_port": 80,
                            "ipv6_cidr_blocks": [],
                            "prefix_list_ids": [],
                            "protocol": "tcp",
                            "security_groups": [],
                            "self": false,
                            "to_port": 8082
                        }
                    ],
                    "name": "devsecops_test",
                    "revoke_rules_on_delete": false,
                    "tags": {
                        "Name": "cool_application"
                    },
                    "tags_all": {
                        "Name": "cool_application"
                    },
                    "timeouts": null,
                    "vpc_id": "vpc-12345678"
                },
                "after_unknown": {
                    "arn": true,
                    "egress": [
                        {
                            "cidr_blocks": [
                                false
                            ],
                            "ipv6_cidr_blocks": [],
                            "prefix_list_ids": [],
                            "security_groups": []
                        }
                    ],
                    "id": true,
                    "ingress": [
                        {
                            "cidr_blocks": [
                                false
                            ],
                            "ipv6_cidr_blocks": [],
                            "prefix_list_ids": [],
                            "security_groups": []
                        }
                    ],
                    "name_prefix": true,
                    "owner_id": true,
                    "tags": {},
                    "tags_all": {}
                },
                "before_sensitive": false,
                "after_sensitive": {
                    "egress": [
                        {
                            "cidr_blocks": [
                                false
                            ],
                            "ipv6_cidr_blocks": [],
                            "prefix_list_ids": [],
                            "security_groups": []
                        }
                    ],
                    "ingress": [
                        {
                            "cidr_blocks": [
                                false
                            ],
                            "ipv6_cidr_blocks": [],
                            "prefix_list_ids": [],
                            "security_groups": []
                        }
                    ],
                    "tags": {},
                    "tags_all": {}
                }
            }
        }
    ],
    "output_changes": {
        "domain_name": {
            "actions": [
                "create"
            ],
            "before": null,
            "after_unknown": true,
            "before_sensitive": false,
            "after_sensitive": false
        }
    },
    "configuration": {
        "provider_config": {
            "aws": {
                "name": "aws",
                "full_name": "registry.terraform.io/hashicorp/aws",
                "expressions": {
                    "region": {
                        "constant_value": "us-east-1"
                    }
                }
            }
        },
        "root_module": {
            "outputs": {
                "domain_name": {
                    "expression": {
                        "references": [
                            "aws_cloudfront_distribution.cloudfront_distribution.domain_name",
                            "aws_cloudfront_distribution.cloudfront_distribution"
                        ]
                    }
                }
            },
            "resources": [
                {
                    "address": "aws_cloudfront_distribution.cloudfront_distribution",
                    "mode": "managed",
                    "type": "aws_cloudfront_distribution",
                    "name": "cloudfront_distribution",
                    "provider_config_key": "aws",
                    "expressions": {
                        "aliases": {
                            "references": [
                                "var.aliases"
                            ]
                        },
                        "default_cache_behavior": [
                            {
                                "allowed_methods": {
                                    "references": [
                                        "var.allowed_methods"
                                    ]
                                },
                                "cached_methods": {
                                    "constant_value": [
                                        "GET",
                                        "HEAD"
                                    ]
                                },
                                "default_ttl": {
                                    "references": [
                                        "var.default_ttl"
                                    ]
                                },
                                "forwarded_values": [
                                    {
                                        "cookies": [
                                            {
                                                "forward": {
                                                    "references": [
                                                        "var.cookies"
                                                    ]
                                                }
                                            }
                                        ],
                                        "query_string": {
                                            "references": [
                                                "var.query_string"
                                            ]
                                        }
                                    }
                                ],
                                "max_ttl": {
                                    "references": [
                                        "var.max_ttl"
                                    ]
                                },
                                "min_ttl": {
                                    "references": [
                                        "var.min_ttl"
                                    ]
                                },
                                "target_origin_id": {
                                    "references": [
                                        "var.webapp_s3_bucket"
                                    ]
                                },
                                "viewer_protocol_policy": {
                                    "constant_value": "redirect-to-https"
                                }
                            }
                        ],
                        "default_root_object": {
                            "references": [
                                "var.default_root_object"
                            ]
                        },
                        "enabled": {
                            "constant_value": true
                        },
                        "is_ipv6_enabled": {
                            "constant_value": false
                        },
                        "logging_config": [
                            {
                                "bucket": {
                                    "references": [
                                        "var.logging_bucket_domain_name"
                                    ]
                                },
                                "prefix": {
                                    "references": [
                                        "var.logging_bucket_prefix"
                                    ]
                                }
                            }
                        ],
                        "origin": [
                            {
                                "domain_name": {
                                    "references": [
                                        "var.webapp_s3_bucket"
                                    ]
                                },
                                "origin_id": {
                                    "references": [
                                        "var.webapp_s3_bucket"
                                    ]
                                }
                            }
                        ],
                        "price_class": {
                            "references": [
                                "var.price_class"
                            ]
                        },
                        "restrictions": [
                            {
                                "geo_restriction": [
                                    {
                                        "locations": {
                                            "references": [
                                                "var.locations"
                                            ]
                                        },
                                        "restriction_type": {
                                            "references": [
                                                "var.restriction_type"
                                            ]
                                        }
                                    }
                                ]
                            }
                        ],
                        "retain_on_delete": {
                            "constant_value": false
                        },
                        "viewer_certificate": [
                            {
                                "acm_certificate_arn": {
                                    "references": [
                                        "var.acm_certificate_arn"
                                    ]
                                },
                                "ssl_support_method": {
                                    "constant_value": "sni-only"
                                }
                            }
                        ]
                    },
                    "schema_version": 1
                },
                {
                    "address": "aws_security_group.devsecops_test",
                    "mode": "managed",
                    "type": "aws_security_group",
                    "name": "devsecops_test",
                    "provider_config_key": "aws",
                    "expressions": {
                        "description": {
                            "constant_value": "Display devsecops "
                        },
                        "egress": {
                            "constant_value": [
                                {
                                    "cidr_blocks": [
                                        "10.20.30.0/24"
                                    ],
                                    "description": null,
                                    "from_port": 7654,
                                    "ipv6_cidr_blocks": null,
                                    "prefix_list_ids": null,
                                    "protocol": "-1",
                                    "security_groups": null,
                                    "self": null,
                                    "to_port": 7655
                                }
                            ]
                        },
                        "ingress": {
                            "constant_value": [
                                {
                                    "cidr_blocks": [
                                        "172.31.0.0/16"
                                    ],
                                    "description": "web app",
                                    "from_port": 80,
                                    "ipv6_cidr_blocks": null,
                                    "prefix_list_ids": null,
                                    "protocol": "tcp",
                                    "security_groups": null,
                                    "self": null,
                                    "to_port": 8082
                                }
                            ]
                        },
                        "name": {
                            "constant_value": "devsecops_test"
                        },
                        "tags": {
                            "constant_value": {
                                "Name": "cool_application"
                            }
                        },
                        "vpc_id": {
                            "constant_value": "vpc-12345678"
                        }
                    },
                    "schema_version": 1
                }
            ],
            "variables": {
                "acm_certificate_arn": {
                    "default": "",
                    "description": "The IAM certificate identifier of the custom viewer certificate for this distribution if you are using a custom domain."
                },
                "aliases": {
                    "default": [],
                    "description": "Extra CNAMEs (alternate domain names), if any, for this distribution"
                },
                "allowed_methods": {
                    "default": [
                        "DELETE",
                        "GET",
                        "HEAD",
                        "OPTIONS",
                        "PATCH",
                        "POST",
                        "PUT"
                    ],
                    "description": "Controls which HTTP methods CloudFront processes and forwards to your Amazon S3 bucket or your custom origin"
                },
                "allowed_methods_choice": {
                    "default": "1",
                    "description": "Select which HTTP methods CloudFront processes and forwards to your Amazon S3 bucket or your custom origin"
                },
                "cf_log_bucket": {
                    "default": "",
                    "description": "The bucket used for logs storing"
                },
                "cloudfront_default_certificate": {
                    "default": "true",
                    "description": "Want your viewers to use HTTPS to request your objects and you're using the CloudFront domain name for your distribution. Select true or specify iam_certificate_id"
                },
                "cookies": {
                    "default": "none",
                    "description": "The forwarded values cookies that specifies how CloudFront handles cookies: all, none or whitelist"
                },
                "custom_domain_name": {
                    "default": "test-bucket",
                    "description": "The domain name of the bucket using the s3 endpoint of the bucket's region"
                },
                "default_root_object": {
                    "default": "index.html",
                    "description": "The object that you want CloudFront to return (for example, index.html) when an user requests the root URL"
                },
                "default_ttl": {
                    "default": "3600",
                    "description": "The default amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request in the absence of an Cache-Control max-age or Expires header"
                },
                "for_test": {
                    "default": "test"
                },
                "locations": {
                    "default": [],
                    "description": "The list of ISO 3166-1-alpha-2 codes for which you want CloudFront either to distribute your content (whitelist) or not distribute your content (blacklist)."
                },
                "logging_bucket_domain_name": {
                    "default": "",
                    "description": "The S3 bucket to store the access logs in, for example, myawslogbucket"
                },
                "logging_bucket_prefix": {
                    "default": "logs",
                    "description": "An optional prefix key that you want CloudFront to use when writing to the logging bucket, for example, myprefix/"
                },
                "max_ttl": {
                    "default": "86400",
                    "description": "The maximum amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request to your origin to determine whether the object has been updated."
                },
                "min_ttl": {
                    "default": "0",
                    "description": "The minimum amount of time that you want objects to stay in CloudFront caches before CloudFront queries your origin to see whether the object has been updated."
                },
                "origin_path": {
                    "default": "",
                    "description": "The origin path"
                },
                "price_class": {
                    "default": "PriceClass_All",
                    "description": "Price classes provide you an option to lower the prices you pay to deliver content out of Amazon CloudFront. One of PriceClass_All, PriceClass_200, PriceClass_100"
                },
                "query_string": {
                    "default": false,
                    "description": "Indicates whether you want CloudFront to forward query strings to the origin"
                },
                "restriction_type": {
                    "default": "none",
                    "description": "The method that you want to use to restrict distribution of your content by country: none, whitelist, or blacklist."
                },
                "viewer_protocol_policy": {
                    "default": "allow-all",
                    "description": "Protocol to access the files in the origin specified by TargetOriginId when a request matches the path pattern in PathPattern. One of allow-all, https-only, or redirect-to-https."
                },
                "webapp_s3_bucket": {
                    "default": "this-is-a-test",
                    "description": "S3 bucket name for webapp deploy"
                }
            }
        }
    },
    "relevant_attributes": [
        {
            "resource": "aws_cloudfront_distribution.cloudfront_distribution",
            "attribute": [
                "domain_name"
            ]
        }
    ]
};
exports.riskAnalysisMock = {
    "proceeded_file": "tmp_709143be-90c8-5a36-b606-10e7f7b321ce.out",
    "success": true,
    "additions": {
        "analysis_state": true,
        "analysis_result": [
            {
                "riskTitle": "\"Any\" service can exit your network to Private IPs",
                "riskSeverity": "medium",
                "riskDescription": "Allowing \"Any\" service to exit your network is extremely risky since the \"Any\" service includes many vulnerable services.  The largest threat is that of Trojan horses contacting their controllers, followed by unintended information leakage, and spreading of malicious code like viruses and worms.",
                "riskRecommendation": "Review all the rules that allow outbound traffic with \nthe service \"Any\" service, and limit them to those services you actually require by deploying a stateful firewall for outbound traffic.",
                "riskId": "O02-NI-SG",
                "items": [
                    {
                        "toPort": 7655,
                        "fromPort": 7654,
                        "ipProtocol": "-1",
                        "ipRange": {
                            "cidrIp": "10.20.30.0/24"
                        }
                    }
                ]
            },
            {
                "riskTitle": "\"Any\" service can enter your network from Private IPs",
                "riskSeverity": "medium",
                "riskDescription": "Allowing the \"Any\" service to enter your network is extremely risky since the \"Any\" service includes many vulnerable services. This is risky even if the traffic is only allowed from business partners or through VPNs.",
                "riskRecommendation": "Review all the rules that allow inbound traffic with \"Any\" service, and limit them to those services you actually require.  ",
                "riskId": "I01-NI-SG",
                "items": [
                    {
                        "toPort": 8082,
                        "fromPort": 80,
                        "ipProtocol": "-1",
                        "ipRange": {
                            "cidrIp": "172.31.0.0/16"
                        }
                    }
                ]
            }
        ]
    }
};
