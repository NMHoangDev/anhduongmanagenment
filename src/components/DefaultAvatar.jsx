import React from 'react';

const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length > 1) {
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const defaultAvatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
};

const DefaultAvatar = ({ name }) => {
    return (
        <div style={defaultAvatarStyle}>
            {getInitials(name)}
        </div>
    );
};

export default DefaultAvatar; 