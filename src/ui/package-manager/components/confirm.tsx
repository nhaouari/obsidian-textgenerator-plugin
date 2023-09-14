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
					<div className="flex flex-col gap-5 overflow-hidden rounded-md bg-[var(--background-primary)] p-4">
						<h3>{title}</h3>
						<div className="flex flex-col gap-3">
							<p>{description}</p>
							<div className="flex items-center justify-end gap-3">
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
