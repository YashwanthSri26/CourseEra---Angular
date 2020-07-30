import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';
import { visibility, flyInOut,expand } from '../animations/app.animation';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
   // tslint:disable-next-line:use-host-property-decorator
   host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
    animations: [
      visibility(),
      flyInOut(),
      expand()
    ]
  })
  
export class DishdetailComponent implements OnInit {

  errMess: string;
  dish : Dish;
  dishIds: string[];
  prev: string;
  next: string;
  commentForm: FormGroup;
  comment: Comment;
  dishCopy: Dish;
  visibility = 'shown';
  @ViewChild('ffrom') commentFormDirective;


  formErrors = {
    'author': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Author Name is required.',
      'minlength':     'Author Name must be at least 2 characters long.',
      'maxlength':     'Author Name cannot be more than 25 characters long.'
    },
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 1 characters long.'
    }
  };

  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,private fb:FormBuilder,@Inject('BaseURL') private BaseURL) { this.createForm();}

    ngOnInit() {
      this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
      this.route.params.pipe(switchMap((params: Params) => {this.visibility = 'hidden'; return this.dishservice.getDish(params['id']); }))
      .subscribe(dish => { this.dish = dish; this.dishCopy = dish; this.setPrevNext(dish.id); this.visibility='shown';},
      errmess => this.errMess = <any>errmess);
    }
  
    setPrevNext(dishId: string) {
      const index = this.dishIds.indexOf(dishId);
      this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
      this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }
    
    goBack(): void {
      this.location.back();
    }

    createForm() {
      this.commentForm = this.fb.group({
        author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
        comment: ['', [Validators.required, Validators.minLength(1)] ],
        rating: 5
      });
  
      this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));
  
      this.onValueChanged(); // (re)set validation messages now
    }
  
    onValueChanged(data?: any) {
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            this.formErrors[field] += messages[key] + ' ';
          }
        }
      }
      this.comment = form.value;
    }
  
    onSubmit() {
      this.comment = this.commentForm.value;
      this.comment.date = new Date().toISOString();
      this.dishCopy.comments.push(this.comment);
      this.dishservice.putDish(this.dishCopy)
        .subscribe(dish =>  {
          this.dish = dish; this.dishCopy = dish;
        },
        errmess => { this.dish = null; this.dishCopy = null; this.errMess = <any>errmess; }  );
      console.log(this.comment);
      this.comment = null;
      this.commentForm.reset({
        author: '',
        comment: '',
        rating: 5
      });
      this.commentForm.reset({
        author: '',
        rating: 5,
        comment: ''
      });
    }
  
}
