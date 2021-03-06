import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromProductRoot from '../reducers';
import { Product } from '../model/product';
import { productAnimations } from '../animations';
import { ProductService } from '../product.service';

const product_width = 112;

@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        productAnimations.accordion,
        productAnimations.moveProduct,
        productAnimations.scaleProduct,
        productAnimations.scaleRotateImg,
        productAnimations.scaleShadow,
    ],
})
export class ProductListComponent implements OnInit, AfterContentInit, AfterViewInit {

    @ViewChild('list') listElm: ElementRef;
    @ViewChild('wrapper') wrapperElm: ElementRef;

    public list$: Observable<Product[]>;

    public listMoveDistance = 0;
    public hoverProductIndex: number = null;
    public isDragging = false; // whether the list is being dragged
    public isExpanding = false; // whether the product is scaling
    public isFadingInOut = false; // whether the list is fading in or out

    private wrapperWidth: number;
    private listWidth: number;
    private initialX = 0;
    private initialMovieDistance = 0;

    private max = 0; // the max that the list could move left
    private min = 0; // the min that the list could move left;

    get listCanAccordion(): boolean {
        return this.isExpanding && !this.isFadingInOut && !this.isDragging;
    }

    constructor( public productService: ProductService,
                 private store: Store<fromProductRoot.State>,
                 private cdRef: ChangeDetectorRef,
                 private router: Router ) {
    }

    public ngOnInit() {
        this.list$ = this.store.pipe(select(fromProductRoot.getAllProducts));
    }

    public ngAfterContentInit(): void {
        this.listMoveDistance = this.productService.listMoveDistance;
    }

    public ngAfterViewInit(): void {
        this.listWidth = this.listElm.nativeElement.offsetWidth;
        this.wrapperWidth = this.wrapperElm.nativeElement.offsetWidth;
        this.max = this.wrapperWidth - this.listWidth;
    }

    public handleSlideStartOnList( event: any ): void {
        this.isDragging = true;
        this.initialX = event.center.x;
        this.initialMovieDistance = this.listMoveDistance;
    }

    public handleSlideEndOnList( event: any ): void {
        if (this.isDragging) {
            const slideDistance = event.center.x - this.initialX;
            this.setListMoveDistance(slideDistance);
            this.isDragging = false;
        }
    }

    public handleSlideOnList( event: any ): void {
        if (this.isDragging) {
            const slideDistance = event.center.x - this.initialX;
            this.setListMoveDistance(slideDistance);
        }
    }

    private setListMoveDistance( slideDistance: number ): void {
        const listMoveDistance = this.initialMovieDistance + slideDistance;

        if (slideDistance < 0 && listMoveDistance >= this.max) {
            this.listMoveDistance = listMoveDistance;
        }

        if (slideDistance > 0 && listMoveDistance <= this.min) {
            this.listMoveDistance = listMoveDistance;
        }
    }

    public handleMouseEnterOnCard( index: number, event: any ): void {
        this.hoverProductIndex = index;
        this.isExpanding = true;
        this.cdRef.markForCheck();
        event.preventDefault();
    }

    public handleMouseLeaveOnCard( index: number, event: any ): void {
        this.isExpanding = false;
        this.cdRef.markForCheck();
        event.preventDefault();
    }

    public getMoveProductStat( index: number ): string {
        if (this.listCanAccordion) {
            if (index > this.hoverProductIndex) {
                return 'right';
            } else if (index < this.hoverProductIndex) {
                return 'left';
            }
        }
        return 'still';
    }

    public handleClickOnProductAnchor( product: Product ): void {
        if (this.isFadingInOut) {
            return;
        }
        this.isExpanding = false;
        this.productService.listMoveDistance = this.listMoveDistance;
        this.router.navigate(['/product/details/', product.id]);
    }

    public handleKeydownOnProductAnchor( product: Product, index: number, event: KeyboardEvent ) {
        const key = event.key;
        if (key === 'Tab') {
            this.hoverProductIndex = index;
            this.isExpanding = true;
            this.setListMoveDistance(index * product_width * -1);
            this.cdRef.markForCheck();
        } else if (key === 'Enter') {
            this.handleClickOnProductAnchor(product);
        }
    }
}
