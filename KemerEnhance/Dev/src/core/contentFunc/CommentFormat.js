import { Lib } from '../../services/client.js';

/* 評論區 重新排版 */
export default async function CommentFormat() {
    Lib.addStyle(`
        .post__comments,
        .scrape__comments {
            display: flex;
            flex-wrap: wrap;
        }
        .post__comments > *:last-child,
        .scrape__comments > *:last-child {
            margin-bottom: 0.5rem;
        }
        .comment {
            margin: 0.5rem;
            max-width: 25rem;
            border-radius: 10px;
            flex-basis: calc(35%);
            word-break: break-all;
            border: 0.125em solid var(--colour1-secondary);
        }
    `, "Comment-Effects", false);
};