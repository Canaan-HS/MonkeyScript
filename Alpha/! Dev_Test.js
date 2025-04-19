const Event1 = Symbol("Event");
const Event2 = Symbol("Event");

const Prototype = {};

const ExtensionA = {
    $on: {
        [Event1]: ()=> {console.log("Event1")},
    },
    $off: {
        [Event1]: ()=> {console.log("Event1-2")},
    }
};

const ExtensionB = {
    $on: {
        [Event2]: ()=> {console.log("Event2")},
    },
    $off: {
        [Event2]: ()=> {console.log("Event2-2")},
    }
};

function PrototypeMerge(Prototype, Extension) {
    Object.keys(Extension).forEach(name => {
        const Repeat = Prototype[name];
        Repeat
            ? Object.assign(Repeat, Extension[name])
            : Object.assign(Prototype, Extension);
    })
};

PrototypeMerge(Prototype, ExtensionA);
PrototypeMerge(Prototype, ExtensionB);

Prototype.$on[Event1]();