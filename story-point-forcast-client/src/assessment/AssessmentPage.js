import React, { useState } from "react";

const AssessmentPage = () => {
    const [text, setText] = useState('');
    const [tags, setTags] = useState({});

    const [skillLevel, setSkillLevel] = useState(0);
    const [editTag, setEditTag] = useState('');

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter')) {
            if (editTag.length !== 0) { // Validate that its numbers 1-5 only
                tags[editTag] = skillLevel;
                setTags({...tags});
                setSkillLevel(0);
                setEditTag('');
            } else if (text.trim() !== '') {
                setTags({...tags, [text.trim()] : 0});
                setText('');
            }
        }
    };

    const removeTag = (tag) => {
        const updatedTags = { ...tags };
        delete updatedTags[tag]; 
        setTags(updatedTags);
    };

    return (
        <div>
            <input
                type="text"
                value={text}
                placeholder="Enter tags, separated by commas or press Enter"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{width: "400px"}}
            />
            <div>
                {Object.keys(tags).map((tag) => (
                    <div key={tag}>
                        {tag + " : "}
                        { tag !== editTag ?
                            tags[tag] : 
                            <input // This is not working
                                type="text"
                                value={text}
                                onChange={(e) => setSkillLevel(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        }
                        <button onClick={() => removeTag(tag)}>x</button>
                        <button onClick={() => setEditTag(tag)}>/</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssessmentPage;