#!/usr/bin/env nu
# parse-audible.nu
# Parse audible json file and convert time remaining to minutes
#
# Created At: Sun Dec 15 20:42:40 +02:00 2024
export def main [
	file: string	# Json file
] {
	open $file | each {|row| 
		mut new_row = $row;
		if ( $row.status == 'Unknown' ) {
			$new_row.timeRemaining = '0h 0m'
			$new_row.minutesRemaining = 0
			$new_row.status = 'Finished'
			return $new_row
		}
		let timed = $row.timeRemaining | str replace ' left' '' | parse '{hours}h {minutes}m' | select hours minutes;
		if ( $timed | length ) > 0 {
			let h = ($timed | first | get hours  | into int | default 0)
			let m = ($timed | last  | get minutes | into int | default 0)
			$new_row.minutesRemaining = ($h * 60 + $m)
			return $new_row
		}
		let timed = $row.timeRemaining | str replace ' left' '' | parse '{minutes}m' | select minutes;
		if ( $timed | length ) > 0 {
			$new_row.minutesRemaining = ($timed | first | get minutes | into int | default 0)
			return $new_row
		}
		let timed = $row.timeRemaining | str replace ' left' '' | parse '{hours}h' | select hours;
		if ( $timed | length ) > 0 {
			$new_row.minutesRemaining = ($timed | first | get hours | into int | default 0) * 60
		}
		return $new_row
	}
}
