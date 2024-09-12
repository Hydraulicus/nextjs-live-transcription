import {ReactNode} from "react";
import "./loadingModal.css"

export const LoadingModal = (): ReactNode => {
    return <div className="relative h-full w-full ">
        <div className="modal-body">
            <div className="sm:max-w-lg sm:w-full m-5 sm:mx-auto">
                <div className="flex flex-col py-4 px-5 ">
                    <div className="overflow-y-auto py-4 min-h-[100px] dark:text-slate-400 text-lg text-center">
                        <p>Neural network models</p>
                        <p>L
                        <svg className='inline w-6 h-6 stroke-slate-400 animate-spin mx-1' viewBox='0 0 24 24'
                             fill='none'
                             xmlns='http://www.w3.org/2000/svg'>
                            <g clipPath='url(#clip0_9023_61563)'>
                                <path
                                    d='M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444'
                                    stroke='stroke-current' strokeWidth='2' strokeLinecap='round'
                                    className='my-path'></path>
                            </g>
                            <defs>
                                <clipPath id='clip0_9023_61563'>
                                    <rect width='24' height='24' fill='white'></rect>
                                </clipPath>
                            </defs>
                        </svg>
                        ading...
                        </p>
                        <p>Please wait a brief second</p>
                    </div>
                </div>
            </div>
        </div>
        <div id="backdrop" className="fixed hidden top-0 left-0 w-full h-full bg-black/50 z-[50]"></div>
    </div>
}