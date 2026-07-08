import BlockAds from './BlockAds.js';
import KeyScroll from './KeyScroll.js';
import CacheFetch from './CacheFetch.js';
import DeleteNotice from './DeleteNotice.js';
import TextToLinkFactory from './TextToLink.js';
import SidebarCollapse from './SidebarCollapse.js';
import BetterPostCardFactory from './BetterPostCard.js';

const globalLoader = {
    BlockAds,
    CacheFetch,
    SidebarCollapse,
    DeleteNotice,
    async TextToLink(...args) {
        const value = TextToLinkFactory().TextToLink;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
    async BetterPostCard(...args) {
        const func = await BetterPostCardFactory();
        const value = func.BetterPostCard;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
    KeyScroll,
}

export default globalLoader;