import React from 'react';
import { Link } from "react-router-dom";
import styled from 'styled-components';

interface ButtonProps {
  to: string;
  label?: string;
}

const Button01 = ({ to, label = "Ver Projetos" }: ButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (to.startsWith('#')) {
      e.preventDefault();
      const targetId = to.replace('#', '');
      const elem = document.getElementById(targetId);
      elem?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <StyledWrapper>
      <Link to={to} className="button-container" onClick={handleClick}>
        <div className="button">
          <span>{label}</span>
        </div>
      </Link>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    width: auto;
    height: auto;
    padding: 0 2rem;
    border-radius: 0.8rem;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0.05)
    );
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.2),
      0 0 20px rgba(255, 255, 255, 0.1);
    transform: rotateX(15deg) translateZ(0);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    position: relative;
    cursor: pointer;
    animation: pulse 2s infinite ease-in-out;
    overflow: hidden;
  }

  .button::before {
    content: "";
    position: absolute;
    top: 0;
    left: -50px;
    width: 50px;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: skewX(-25deg);
    animation: shine 3s infinite linear;
    pointer-events: none;
    z-index: 1;
  }

  .button::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 10%;
    width: 80%;
    height: 10px;
    background: radial-gradient(
      ellipse at center,
      rgba(0, 255, 170, 0.3) 0%,
      transparent 70%
    );
    z-index: -1;
  }

  .button span {
    position: relative;
    z-index: 2;
    color: white;
    font-size: 12pt;
    font-family: Arial, sans-serif;
    text-shadow: 0 1px 2px rgba(0, 187, 134, 0.5);
    display: block;
    line-height: 60px;
    text-align: center;
  }

  .button:hover {
    transform: rotateX(0deg) translateZ(15px) scale(1.05);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 255, 179, 0.2),
      0 8px 16px rgba(0, 255, 166, 0.3),
      0 0 40px rgba(255, 255, 255, 0.25);
  }

  .button:active {
    transform: rotateX(0deg) translateZ(-5px) scale(0.95);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.2),
      0 0 10px rgba(255, 255, 255, 0.1);
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow:
        inset 0 1px 2px rgba(255, 255, 255, 0.4),
        inset 0 -1px 2px rgba(0, 0, 0, 0.2),
        0 4px 8px rgba(0, 0, 0, 0.2),
        0 0 20px rgba(255, 255, 255, 0.1);
    }
    50% {
      box-shadow:
        inset 0 1px 2px rgba(255, 255, 255, 0.4),
        inset 0 -1px 2px rgba(0, 0, 0, 0.2),
        0 4px 8px rgba(0, 0, 0, 0.2),
        0 0 30px rgba(255, 255, 255, 0.2);
    }
  }

  @keyframes shine {
    0% {
      left: -7rem;
    }
    100% {
      left: 50rem;
    }
  }
`;

export default Button01;