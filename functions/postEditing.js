const textFormat = (text) => {

    const charRemove = ['[…]', '.'];

    var desc = text.split(' ');
    
    if (desc[desc.length -1].includes(charRemove[0])){
        desc.pop();
    }else if(desc[desc.length -1].includes(charRemove[1])){
        const temp = desc[desc.length -1].replace(charRemove[1], '');
        desc.pop();
        desc.push(temp);
    }

    return desc.join(' ');

};

const hashTagsFormat = (categories) => {
    
    const hashTags = [];
    categories.map(cat => {
        tag = cat.replace(/-|,|\s/g, '');
        hashTags.push('#' + tag);
    });

    return hashTags.join(' ');
};


module.exports = {
    textFormat,
    hashTagsFormat
};