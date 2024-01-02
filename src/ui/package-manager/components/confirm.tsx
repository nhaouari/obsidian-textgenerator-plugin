import React from "react";
import { confirmAlert } from "react-confirm-alert"; // Import

export default async function Confirm(
	description: string,
	title = "Are you sure?"
) {
	return new Promise((solve) => {
		confirmAlert({
			customUI: ({ onClose }) => {
				return (
					//absolute mx-auto w-72 left-0 right-0
					<div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-5 plug-tg-overflow-hidden plug-tg-rounded-md plug-tg-bg-[var(--background-primary)] plug-tg-p-4">
						<h3>{title}</h3>
						<div className="plug-tg-flex plug-tg-flex-col plug-tg-gap-3">
							<p>{description}</p>
							<div className="plug-tg-flex plug-tg-items-center plug-tg-justify-end plug-tg-gap-3">
								<button
									onClick={() => {
										solve(false);
										onClose();
									}}
								>
									Cancel
								</button>
								<button
									onClick={() => {
										solve(true);
										onClose();
									}}
								>
									Ok
								</button>
							</div>
						</div>
					</div>
				);
			},
			title: title,
			message: description,
			onClickOutside: () => solve(false),
			//   buttons: [
			//     {
			//       label: "Ok",
			//       onClick: () => solve(true),
			//     },
			//     {
			//       label: "Cancel",
			//       onClick: () => solve(false),
			//     },
			//   ],
		});
	});
}
