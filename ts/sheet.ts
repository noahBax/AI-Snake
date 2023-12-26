const SHEET = {
	"0": {
		"x": 1,
		"y": 1
	},
	"180": {
		"x": 13,
		"y": 1
	},
	"270": {
		"x": 25,
		"y": 1
	},
	"90": {
		"x": 1,
		"y": 13
	},
	"apple": {
		"x": 13,
		"y": 13
	},
	"deadDown": {
		"x": 25,
		"y": 13
	},
	"deadLeft": {
		"x": 1,
		"y": 25
	},
	"deadRight": {
		"x": 13,
		"y": 25
	},
	"deadUp": {
		"x": 25,
		"y": 25
	},
	"down": {
		"x": 37,
		"y": 1
	},
	"horizontal": {
		"x": 37,
		"y": 13
	},
	"left": {
		"x": 37,
		"y": 25
	},
	"right": {
		"x": 1,
		"y": 37
	},
	"up": {
		"x": 13,
		"y": 37
	},
	"vertical": {
		"x": 25,
		"y": 37
	}
}

type sprites = "0" |
"180" |
"270" |
"90" |
"apple" |
"down" |
"horizontal" |
"left" |
"right" |
"up" |
"vertical" |
"deadDown" |
"deadLeft" |
"deadRight" |
"deadUp";

export { SHEET, sprites };