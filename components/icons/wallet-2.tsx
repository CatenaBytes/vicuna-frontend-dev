import React from "react";

interface WalletProps extends React.SVGProps<SVGSVGElement> {}

export const Wallet2: React.FC<WalletProps> = (props) => {
  return (
    <svg
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.5744 6.28569H16.0029V2.85713C16.0029 2.70558 15.9427 2.56024 15.8356 2.45307C15.7284 2.34591 15.5831 2.28571 15.4315 2.28571H1.71729C1.58198 2.28791 1.45028 2.24203 1.34564 2.15622C1.241 2.07041 1.1702 1.95025 1.14586 1.81714V1.61142C1.1702 1.4783 1.241 1.35814 1.34564 1.27234C1.45028 1.18653 1.58198 1.14065 1.71729 1.14285H15.1915C15.3431 1.14285 15.4884 1.08265 15.5956 0.975486C15.7027 0.868322 15.7629 0.722978 15.7629 0.571426C15.7629 0.419875 15.7027 0.27453 15.5956 0.167367C15.4884 0.0602038 15.3431 0 15.1915 0H1.71729C1.26263 0 0.826599 0.180611 0.505109 0.502101C0.183619 0.82359 0.00300812 1.25962 0.00300812 1.71428C-0.00100271 1.78279 -0.00100271 1.85148 0.00300812 1.91999V13.6742C0.00525113 13.9819 0.0680743 14.2861 0.18789 14.5695C0.307706 14.8529 0.482169 15.1099 0.701316 15.3259C0.920463 15.5418 1.18 15.7125 1.46512 15.8282C1.75023 15.9438 2.05533 16.0022 2.363 15.9999H15.4315C15.5831 15.9999 15.7284 15.9397 15.8356 15.8326C15.9427 15.7254 16.0029 15.5801 16.0029 15.4285V12H16.5744C16.7259 12 16.8713 11.9397 16.9784 11.8326C17.0856 11.7254 17.1458 11.5801 17.1458 11.4285V6.85712C17.1458 6.70556 17.0856 6.56022 16.9784 6.45306C16.8713 6.34589 16.7259 6.28569 16.5744 6.28569ZM14.8601 14.8571H2.363C2.04517 14.8602 1.73899 14.7376 1.51105 14.5161C1.28312 14.2946 1.15187 13.992 1.14586 13.6742V3.35999C1.33135 3.41374 1.52435 3.4369 1.71729 3.42856H14.8601V6.28569H10.8601C10.1024 6.28569 9.37563 6.58671 8.83981 7.12252C8.304 7.65834 8.00298 8.38506 8.00298 9.14282C8.00298 9.90058 8.304 10.6273 8.83981 11.1631C9.37563 11.6989 10.1024 12 10.8601 12H14.8601V14.8571ZM16.0029 10.8571H10.8601C10.4055 10.8571 9.96942 10.6765 9.64793 10.355C9.32644 10.0335 9.14583 9.59748 9.14583 9.14282C9.14583 8.68817 9.32644 8.25213 9.64793 7.93064C9.96942 7.60915 10.4055 7.42854 10.8601 7.42854H16.0029V10.8571Z"
        fill="#3D365C"
      />
    </svg>
  );
};
