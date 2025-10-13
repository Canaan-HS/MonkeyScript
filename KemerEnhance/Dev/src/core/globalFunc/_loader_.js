import SidebarCollapse from './SidebarCollapse.js';
import DeleteNotice from './DeleteNotice.js';
import KeyScroll from './KeyScroll.js';
import BlockAds from './BlockAds.js';
import CacheFetch from './CacheFetch.js';
import TextToLinkFactory from './TextToLink.js';
import BetterPostCardFactory from './BetterPostCard.js';

const globalLoader = {
    SidebarCollapse,
    DeleteNotice,
    KeyScroll,
    BlockAds,
    CacheFetch,
    async TextToLink(...args) {
        const value = TextToLinkFactory().TextToLink;
        Object.defineProperty(this, value.name, { value, writable: false });
        value(...args);
    },
    async BetterPostCard(...args) {
        const func = await BetterPostCardFactory();
        const value = func.BetterPostCard;
        Object.defineProperty(this, value.name, { value, writable: false });
        value(...args);
    },
}

export default globalLoader;