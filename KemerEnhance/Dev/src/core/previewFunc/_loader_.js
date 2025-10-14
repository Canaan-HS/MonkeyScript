import NewTabOpens from './NewTabOpens.js';
import CardText from './CardText.js';
import CardZoom from './CardZoom.js';
import QuickPostToggle from './QuickPostToggle.js';
import BetterThumbnailFactory from './BetterThumbnail.js';

const previewLoader = {
    NewTabOpens,
    CardText,
    CardZoom,
    async BetterThumbnail(...args) {
        const value = BetterThumbnailFactory().BetterThumbnail;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
    QuickPostToggle
};

export default previewLoader;