import CardText from './CardText.js';
import CardZoom from './CardZoom.js';
import NewTabOpens from './NewTabOpens.js';
import QuickPostToggle from './QuickPostToggle.js';
import BetterThumbnailFactory from './BetterThumbnail.js';

const previewLoader = {
    CardText,
    CardZoom,
    NewTabOpens,
    QuickPostToggle,
    async BetterThumbnail(...args) {
        const value = BetterThumbnailFactory().BetterThumbnail;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
};

export default previewLoader;